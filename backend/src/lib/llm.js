// src/lib/llm.js
import { ChatGroq } from "@langchain/groq";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import config from "../config/index.js";
import logger from "./logger.js";

/**
 * Extract a "wait this many ms" hint from a rate-limit error.
 * Groq returns a `retry-after` header (seconds) and often repeats the
 * wait time in the error message too ("Please try again in 12.4s").
 * Falls back to `fallbackMs` if nothing usable is found.
 */
function getRateLimitDelayMs(error, fallbackMs) {
  const headerRetryAfter =
    error?.headers?.get?.("retry-after") ?? error?.headers?.["retry-after"];
  if (headerRetryAfter) {
    const seconds = parseFloat(headerRetryAfter);
    if (!Number.isNaN(seconds)) return Math.ceil(seconds * 1000) + 250;
  }

  const message = error?.message || error?.error?.error?.message || "";
  const match = message.match(/try again in ([\d.]+)s/i);
  if (match) {
    return Math.ceil(parseFloat(match[1]) * 1000) + 250;
  }

  return fallbackMs;
}

function isRateLimitError(error) {
  return (
    error?.status === 429 ||
    error?.error?.error?.code === "rate_limit_exceeded" ||
    error?.name === "RateLimitQuotaExhaustedError"
  );
}

/**
 * Wrap an async function with retry logic.
 * Rate-limit (429) errors are retried more patiently, waiting however
 * long the provider says the quota window needs to reset, rather than a
 * short fixed exponential backoff that's guaranteed to fail again.
 */
function withRetry(fn, { maxRetries = 3, initialDelay = 1000 } = {}) {
  return async (...args) => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) throw error;

        const rateLimited = isRateLimitError(error);
        const delay = rateLimited
          ? getRateLimitDelayMs(error, initialDelay * Math.pow(2, attempt - 1))
          : initialDelay * Math.pow(2, attempt - 1);

        logger.warn(
          { attempt, error: error.message, delay, rateLimited },
          `LLM call failed, retrying in ${delay}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  };
}

/**
 * Global queue that serializes every Groq call across the whole app.
 * Groq's TPM (tokens-per-minute) limit is shared across your entire
 * organization, not per-request — so firing several agent calls in
 * parallel (as the supervisor does) bursts past the budget even though
 * each individual call is small. Serializing calls here means only one
 * Groq request is in flight at a time, which is the simplest way to stay
 * under the limit without having to precisely count tokens per request.
 */
let groqQueue = Promise.resolve();
function enqueueGroqCall(fn) {
  const run = groqQueue.then(fn, fn); // run regardless of prior success/failure
  // Keep the chain alive even if this call fails, so later calls aren't blocked.
  groqQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/**
 * Get an LLM model instance with built-in retries.
 * Default model is read from config.defaultLlmModel, which defaults to
 * Groq's "llama-3.3-70b-versatile" — the project's default LLM brain.
 * Gemini is not used anywhere in this project.
 */
export function getLLM(modelName = config.defaultLlmModel, options = {}) {
  const temperature = options.temperature ?? 0;

  let Provider;
  let apiKey;
  let isGroq = false;
  let isOpenRouter = false;

  // ── OpenRouter: unified provider for all models ──────────────────────
  if (config.openrouterApiKey) {
    Provider = ChatOpenAI;
    apiKey = config.openrouterApiKey;
    isOpenRouter = true;

    // OpenRouter model IDs are already provider-prefixed (e.g.
    // "anthropic/claude-sonnet-4", "openai/gpt-5", "meta-llama/llama-4-maverick").
    // If the caller passed a bare model name without a slash, prefix it
    // with the likely provider so OpenRouter can route it.
    if (!modelName.includes("/")) {
      if (modelName.startsWith("gpt-")) {
        modelName = `openai/${modelName}`;
      } else if (modelName.startsWith("claude-")) {
        modelName = `anthropic/${modelName}`;
      } else if (modelName.startsWith("llama-")) {
        modelName = `meta-llama/${modelName}`;
      }
      // Add more bare-name → OpenRouter ID mappings here as needed.
    }
  }
  // ── Direct providers (fallback when OpenRouter key is missing) ───────
  else if (modelName.startsWith("gpt-")) {
    Provider = ChatOpenAI;
    apiKey = config.openaiApiKey;
  } else if (modelName.startsWith("claude-")) {
    Provider = ChatAnthropic;
    apiKey = config.anthropicApiKey;
  } else if (modelName.startsWith("llama-") || modelName.includes("groq")) {
    Provider = ChatGroq;
    apiKey = config.groqApiKey;
    isGroq = true;
  } else {
    logger.warn(
      { modelName },
      `Unrecognized model "${modelName}", falling back to Groq default "${config.defaultLlmModel}"`,
    );
    Provider = ChatGroq;
    apiKey = config.groqApiKey;
    modelName = config.defaultLlmModel;
    isGroq = true;
  }

  if (!apiKey) {
    throw new Error(
      `API key missing for model: ${modelName}. ` +
        (isOpenRouter
          ? "Set OPENROUTER_API_KEY in your .env file."
          : "Set the relevant provider API key (GROQ_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY) in your .env file."),
    );
  }

  const modelConfig = {
    model: modelName,
    temperature,
    apiKey,
    ...options,
  };

  // When using OpenRouter we must point the OpenAI SDK at their endpoint.
  if (isOpenRouter) {
    modelConfig.configuration = {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": config.appUrl || "http://localhost:3000",
        "X-Title": config.appName || "My App",
      },
    };
  }

  const model = new Provider(modelConfig);

  const boundInvoke = model.invoke.bind(model);
  const boundStream = model.stream.bind(model);

  // Groq calls: serialize through the shared queue AND retry with
  // rate-limit-aware backoff. This is what actually keeps you under the
  // org-wide TPM budget when multiple agents run "in parallel".
  // OpenRouter calls do NOT need the Groq queue — they go through normal
  // retry logic only.
  model.invoke = isGroq
    ? withRetry((...args) => enqueueGroqCall(() => boundInvoke(...args)), {
        maxRetries: 5,
      })
    : withRetry(boundInvoke, { maxRetries: 3 });

  model.stream = isGroq
    ? withRetry((...args) => enqueueGroqCall(() => boundStream(...args)), {
        maxRetries: 3,
      })
    : withRetry(boundStream, { maxRetries: 2 });

  return model;
}

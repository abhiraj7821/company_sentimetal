// src/lib/costTracker.js
import logger from "./logger.js";

/**
 * Singleton cost tracker for monitoring token usage and compute cost.
 * Not thread-safe, but sufficient for single‑process Node.js.
 */
class CostTracker {
  constructor() {
    this.usage = []; // array of { model, promptTokens, completionTokens, cost }
    this.startTime = Date.now();
  }

  /**
   * Record token usage for a model call.
   * @param {string} model - model name
   * @param {number} promptTokens - number of prompt tokens
   * @param {number} completionTokens - number of completion tokens
   */
  track(model, promptTokens, completionTokens) {
    // Approximate cost per 1k tokens (prices as of early 2025)
    const PRICING = {
      // Groq (free)
      "llama-3.3-70b-versatile": { input: 0, output: 0 },
      // OpenAI
      "gpt-4": { input: 0.03, output: 0.06 },
      "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
      // Anthropic (rough)
      "claude-haiku-4-5-20251001": { input: 0.015, output: 0.075 },
    };

    const price = PRICING[model] || { input: 0, output: 0 };
    const cost =
      (promptTokens / 1000) * price.input +
      (completionTokens / 1000) * price.output;

    this.usage.push({
      model,
      promptTokens,
      completionTokens,
      cost,
      timestamp: new Date().toISOString(),
    });

    logger.debug(
      { model, promptTokens, completionTokens, cost: `$${cost.toFixed(6)}` },
      "Token usage recorded",
    );
  }

  /**
   * Get total cost and token usage report.
   * @returns {{ totalCost: number, totalPromptTokens: number, totalCompletionTokens: number, totalCalls: number, elapsedMs: number }}
   */
  getReport() {
    const totalPromptTokens = this.usage.reduce(
      (sum, u) => sum + u.promptTokens,
      0,
    );
    const totalCompletionTokens = this.usage.reduce(
      (sum, u) => sum + u.completionTokens,
      0,
    );
    const totalCost = this.usage.reduce((sum, u) => sum + u.cost, 0);
    const elapsedMs = Date.now() - this.startTime;

    return {
      totalCost: parseFloat(totalCost.toFixed(4)),
      totalPromptTokens,
      totalCompletionTokens,
      totalCalls: this.usage.length,
      elapsedMs,
    };
  }

  /**
   * Reset the tracker.
   */
  reset() {
    this.usage = [];
    this.startTime = Date.now();
    logger.info("Cost tracker reset");
  }
}

// Singleton instance
export const costTracker = new CostTracker();

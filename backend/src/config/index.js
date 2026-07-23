// src/config/index.js
import dotenv from "dotenv";
dotenv.config(); // Load .env into process.env (only once)

const config = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  checkpointer: process.env.CHECKPOINTER || "memory", // "postgres", "sqlite", "memory"
  checkpointerPath: process.env.CHECKPOINTER_PATH || ":memory:",

  // Database (PostgreSQL with pgvector)
  databaseUrl:
    process.env.DATABASE_URL || "postgresql://localhost:5432/sentinelswarm",

  // Redis (BullMQ job queue)
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",

  // LLM API keys
  geminiApiKey: process.env.GEMINI_API_KEY,
  defaultLlmModel: process.env.DEFAULT_LLM_MODEL || "llama-3.3-70b-versatile",
  // defaultLlmModel: process.env.DEFAULT_LLM_MODEL || "llama-3.1-8b-instant",
  groqApiKey: process.env.GROQ_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  appUrl: process.env.APP_URL,
  appName: process.env.APP_NAME,

  // newsdata.io
  newsdata_api_key: process.env.NEWSDATA_API_KEY,

  hfToken: process.env.HF_TOKEN,

  // External data APIs (free tiers)
  newsApiKey: process.env.NEWSAPI_KEY, // optional, GDELT used as fallback
  alphaVantageKey: process.env.ALPHAVANTAGE_KEY, // optional

  // RAG
  embeddingModel: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
  embeddingDimension: parseInt(process.env.EMBEDDING_DIMENSION || "1536", 10),

  // Rate limits (calls per second)
  rateLimits: {
    secEdgar: 10,
    gdelt: 5,
    cheerio: 3,
  },

  // Graph execution
  maxResearchLoops: parseInt(process.env.MAX_RESEARCH_LOOPS || "3", 10),
  humanApprovalTimeoutMs: parseInt(
    process.env.HUMAN_APPROVAL_TIMEOUT_MS || "3600000",
    10,
  ),

  // Logging
  logLevel: process.env.LOG_LEVEL || "info",
};

export default config;

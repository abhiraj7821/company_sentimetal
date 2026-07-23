// src/middleware/rateLimiter.js
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/**
 * Strict rate limiter:
 * - 1 request per 5 minutes per IP address
 * - Returns 429 with a clear message when exceeded
 */
export const researchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1, // only 1 request per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Use the built-in helper to normalize IPv6 addresses, preventing bypass.
    return ipKeyGenerator(req);
  },
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message:
          "Too many requests. You can start a new research run once every 5 minutes.",
        retryAfter: Math.ceil(req.rateLimit.resetTime / 1000), // seconds until reset
      },
    });
  },
});

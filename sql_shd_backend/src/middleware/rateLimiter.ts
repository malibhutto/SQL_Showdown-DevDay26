import rateLimit from 'express-rate-limit';
import { config } from '../config';

/**
 * Rate limiter for run endpoint
 */
export const runRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRun,
  message: {
    error: `Too many run requests. Maximum ${config.rateLimit.maxRun} per minute allowed.`
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use team name as key if authenticated, otherwise IP
  keyGenerator: (req) => {
    return req.user?.teamName || req.ip || 'unknown';
  }
});

/**
 * Rate limiter for submit endpoint
 */
export const submitRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxSubmit,
  message: {
    error: `Too many submit requests. Maximum ${config.rateLimit.maxSubmit} per minute allowed.`
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.teamName || req.ip || 'unknown';
  }
});

/**
 * General API rate limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 100, // 100 requests per minute
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Auth rate limiter (more strict to prevent brute force)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: {
    error: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import config from '../config';

/**
 * Security headers middleware (Helmet)
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for some frameworks
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

/**
 * CORS configuration
 * Supports multiple origins via ALLOWED_ORIGINS environment variable (comma-separated)
 * Falls back to FRONTEND_URL or localhost for development
 */
export const corsConfig = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list (exact match)
    if (config.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Also check normalized (case-insensitive, trailing slash removed)
    const normalizedOrigin = origin.toLowerCase().replace(/\/$/, '');
    const normalizedAllowed = config.allowedOrigins.map(o => o.toLowerCase().replace(/\/$/, ''));
    if (normalizedAllowed.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    
    // In development, allow localhost variations
    if (config.nodeEnv === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Reject origin
    callback(new Error(`Not allowed by CORS: ${origin}. Allowed origins: ${config.allowedOrigins.join(', ')}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400, // 24 hours
});

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in test environment
  skip: () => config.nodeEnv === 'test',
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMaxRequests,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  skip: () => config.nodeEnv === 'test',
});

/**
 * Request size limiter
 * Prevent large payloads
 */
export const requestSizeLimit = '10mb';


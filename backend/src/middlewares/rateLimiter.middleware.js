const logger = require('../utils/logger');
const ApiError = require('../utils/apiError');
const { HTTP_STATUS } = require('../utils/constants');

let expressRateLimit;
try {
  expressRateLimit = require('express-rate-limit');
} catch (e) {
  logger.warn('express-rate-limit package not available. Using built-in rate limiter.');
}

/**
 * Helper to detect local development environment or localhost client IP
 */
const isDevOrLocalhost = (req) => {
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    return true;
  }

  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === '::ffff:127.0.0.1' ||
    ip.includes('127.0.0.1') ||
    ip.includes('localhost')
  );
};

/**
 * Built-in in-memory rate limiter fallback
 */
const createInMemoryLimiter = (windowMs = 15 * 60 * 1000, max = 5, message = 'Too many requests. Please try again later.') => {
  const hits = new Map();

  return (req, res, next) => {
    if (isDevOrLocalhost(req)) {
      return next();
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown-ip';
    const now = Date.now();
    const clientData = hits.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > clientData.resetTime) {
      clientData.count = 1;
      clientData.resetTime = now + windowMs;
    } else {
      clientData.count += 1;
    }

    hits.set(ip, clientData);

    if (clientData.count > max) {
      const retryAfterSeconds = Math.ceil((clientData.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return next(new ApiError(HTTP_STATUS.TOO_MANY_REQUESTS, message));
    }

    next();
  };
};

/**
 * Rate Limiter Factory
 */
const createRateLimiter = (windowMs, max, message) => {
  if (expressRateLimit) {
    return expressRateLimit({
      windowMs,
      max: process.env.NODE_ENV === 'development' ? 1000 : max,
      skip: (req) => isDevOrLocalhost(req),
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
        success: false,
        message
      }
    });
  }
  return createInMemoryLimiter(windowMs, max, message);
};

const loginLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10,             // 10 attempts per IP
  'Too many login attempts from this IP address. Please try again after 15 minutes.'
);

const registerLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  5,              // 5 registrations per IP per hour
  'Too many accounts created from this IP address. Please try again later.'
);

const passwordResetLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5,              // 5 password reset requests per IP
  'Too many password reset requests. Please try again after 15 minutes.'
);

const emailVerificationLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5,
  'Too many verification email requests. Please try again after 15 minutes.'
);

module.exports = {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  emailVerificationLimiter
};

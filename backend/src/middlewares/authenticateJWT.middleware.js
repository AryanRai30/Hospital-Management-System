const { verifyToken } = require('./auth.middleware');

/**
 * authenticateJWT Middleware
 * Alias wrapper for JWT authentication middleware
 */
const authenticateJWT = verifyToken;

module.exports = authenticateJWT;

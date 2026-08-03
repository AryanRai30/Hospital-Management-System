const jwt = require('jsonwebtoken');
const ApiError = require('../utils/apiError');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * JWT Authentication middleware setup stub.
 * Note: Implementation reserved for auth module phase.
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Access token missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired token'));
  }
};

/**
 * Role authorization middleware setup stub.
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ApiError(HTTP_STATUS.FORBIDDEN, 'Unauthorized access for this role'));
    }
    next();
  };
};

module.exports = {
  verifyToken,
  authorizeRoles
};

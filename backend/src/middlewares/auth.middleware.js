const jwt = require('jsonwebtoken');
const ApiError = require('../utils/apiError');
const { HTTP_STATUS } = require('../utils/constants');
const UserModel = require('../models/user.model');

/**
 * Verify JWT Access Token Middleware
 */
const verifyToken = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } 
    // 2. Check cookies
    else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication token missing. Please log in.');
    }

    // 3. Verify Token
    const secret = process.env.JWT_SECRET || 'enterprise_hospital_jwt_access_secret_key_2026';
    const decoded = jwt.verify(token, secret);

    // 4. Verify user exists and is active
    const user = await UserModel.findById(decoded.id);
    if (!user || !user.is_active) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User account is deactivated or no longer exists.');
    }

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role_name,
      isEmailVerified: Boolean(user.is_email_verified)
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Access token has expired. Please refresh your session.'));
    }
    return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid authentication token.'));
  }
};

/**
 * Role Authorization Middleware
 * Usage: authorizeRoles('ADMIN', 'DOCTOR')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required'));
    }

    const normalizedUserRole = req.user.role ? req.user.role.toUpperCase() : '';
    const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

    if (!normalizedAllowed.includes(normalizedUserRole)) {
      return next(
        new ApiError(
          HTTP_STATUS.FORBIDDEN,
          `Access forbidden. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`
        )
      );
    }

    next();
  };
};

module.exports = {
  verifyToken,
  authorizeRoles
};

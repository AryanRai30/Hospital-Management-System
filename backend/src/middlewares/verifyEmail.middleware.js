const ApiError = require('../utils/apiError');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * verifyEmail Middleware
 * Ensures user has a verified email address before accessing protected resources
 */
const verifyEmail = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required'));
  }

  if (!req.user.isEmailVerified) {
    return next(
      new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'Email verification required. Please verify your email address to access this resource.'
      )
    );
  }

  next();
};

module.exports = verifyEmail;

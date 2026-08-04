const ApiError = require('../utils/apiError');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Middleware ensuring user has verified their email address before accessing restricted features
 */
const requireEmailVerified = (req, res, next) => {
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

module.exports = requireEmailVerified;

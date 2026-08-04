const ApiError = require('../utils/apiError');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * validatePassword Middleware
 * Validates strong password rules: ≥8 characters, ≥1 uppercase letter, ≥1 number
 */
const validatePassword = (req, res, next) => {
  const password = req.body.password || req.body.newPassword;

  if (!password) {
    return next(new ApiError(HTTP_STATUS.BAD_REQUEST, 'Password is required'));
  }

  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!minLength || !hasUppercase || !hasNumber) {
    return next(
      new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Password must be at least 8 characters long, contain at least one uppercase letter, and at least one number.'
      )
    );
  }

  next();
};

module.exports = validatePassword;

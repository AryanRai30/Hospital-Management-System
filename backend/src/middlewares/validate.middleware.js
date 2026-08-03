const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');
const { HTTP_STATUS } = require('../utils/constants');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg
    }));
    return next(new ApiError(HTTP_STATUS.BAD_REQUEST, 'Validation failed', extractedErrors));
  }
  next();
};

module.exports = validate;

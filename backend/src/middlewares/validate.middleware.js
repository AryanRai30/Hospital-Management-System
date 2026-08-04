const { body, query, validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');
const { HTTP_STATUS } = require('../utils/constants');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg
    }));
    return next(new ApiError(HTTP_STATUS.BAD_REQUEST, errors.array()[0].msg, extractedErrors));
  }
  next();
};

const registerValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('roleName')
    .optional()
    .isIn(['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN'])
    .withMessage('Invalid role specified'),
  body('phoneNumber')
    .optional({ checkFalsy: true })
    .isMobilePhone()
    .withMessage('Please enter a valid phone number'),
  validate
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

const verifyEmailValidation = [
  body('token')
    .optional()
    .notEmpty()
    .withMessage('Verification token is required'),
  query('token')
    .optional()
    .notEmpty()
    .withMessage('Verification token is required'),
  validate
];

const forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address'),
  validate
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter'),
  validate
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('New password must contain at least one number')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter'),
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  verifyEmailValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation
};

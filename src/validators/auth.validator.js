/**
 * Authentication validation schemas
 * Joi schemas for validating authentication-related requests
 */
const Joi = require('joi');

// Common validation patterns
const email = Joi.string().email().lowercase().trim().required();
const password = Joi.string().min(8).max(128).required();
// .pattern(
//   new RegExp(
//     '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
//   ),
// )
// .message(
//   'Password must contain at least one letter, one number and one special character',
// );
const strongPassword = Joi.string().min(8).max(128).required();
// .pattern(
//   new RegExp(
//     '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
//   ),
// )
// .message(
//   'Password must be at least 8 characters with uppercase, lowercase, number and special character',
// );

/**
 * User registration validation schema
 */
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(200).trim(),
  firstName: Joi.string().min(1).max(150).trim(),
  lastName: Joi.string().min(1).max(150).trim(),
  email,
  password: strongPassword,
  role: Joi.string().valid('USER', 'SURGEON', 'ADMIN').default('USER'),
}).or('name', 'firstName');

/**
 * User login validation schema
 */
const loginSchema = Joi.object({
  email,
  password: Joi.string().required(),
});

/**
 * Refresh token validation schema
 */
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

/**
 * Change password validation schema
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: strongPassword,
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Confirm password does not match new password',
    }),
});

/**
 * Forgot password validation schema
 */
const forgotPasswordSchema = Joi.object({
  email,
});

/**
 * Reset password validation schema
 */
const resetPasswordSchema = Joi.object({
  email,
  code: Joi.string().required(),
  password: strongPassword,
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Confirm password does not match password',
  }),
});

const otpVerifySchema = Joi.object({
  email,
  code: Joi.string()
    .pattern(/^\d{6}$/)
    .required(),
});

const resendOtpSchema = Joi.object({
  email,
  type: Joi.string().valid('registration', 'forgot-password').required(),
});

/**
 * Update profile validation schema
 */
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(200).trim().optional(),
  profileStep: Joi.number().integer().min(1).max(10).optional(),
  isActive: Joi.boolean().optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  otpVerifySchema,
  resendOtpSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
};

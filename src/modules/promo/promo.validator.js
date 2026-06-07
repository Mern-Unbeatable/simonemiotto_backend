const Joi = require('joi');

const createPromoCodeSchema = Joi.object({
  codeName: Joi.string().trim().uppercase().min(3).max(20).required().messages({
    'string.empty': 'Promo code cannot be empty.',
    'any.required': 'Promo code is a required field.',
  }),
  offerType: Joi.string()
    .valid('DISCOUNT', 'FREE_ACCESS', 'EXTRA_DAYS')
    .required(),
  offerValue: Joi.number()
    .min(0)
    .when('offerType', {
      is: 'FREE_ACCESS',
      then: Joi.optional().allow(null, 0),
      otherwise: Joi.required(),
    }),

  expiryDate: Joi.date().iso().greater('now').required().messages({
    'date.greater': 'Expiry date must be a future date.',
  }),
  subscriptionTierId: Joi.string().trim().allow(null, '').optional(),
  usageLimit: Joi.number().integer().positive().allow(null).optional(),
});

const useForValidation = Joi.object({
  code: Joi.string().trim().uppercase().required().messages({
    'string.empty': 'Promo code cannot be empty.',
    'any.required': 'Promo code is a required field.',
  }),
  subscriptionTierId: Joi.string().trim().allow(null, '').required(),
});

const sendEmailSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address.',
    'any.required': 'Email is a required field.',
  }),
  subject: Joi.string().trim().required().messages({
    'string.empty': 'Email subject cannot be empty.',
    'any.required': 'Email subject is a required field.',
  }),
  message: Joi.string().trim().required().messages({
    'string.empty': 'Email message cannot be empty.',
    'any.required': 'Email message is a required field.',
  }),
});

module.exports = { createPromoCodeSchema, useForValidation, sendEmailSchema };

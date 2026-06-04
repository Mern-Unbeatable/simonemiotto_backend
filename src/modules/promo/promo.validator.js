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

module.exports = { createPromoCodeSchema, useForValidation };

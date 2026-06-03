const Joi = require('joi');

// Schema for creating a new subscription tier
const createSubscriptionTierSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Plan name cannot be empty.',
    'any.required': 'Plan name is a required field.',
  }),
  description: Joi.string().trim().allow(null, '').optional(),
  stripePriceId: Joi.string().trim().allow(null, '').optional(),
  durationDays: Joi.number().integer().positive().required().messages({
    'number.base': 'Duration days must be a number.',
    'number.positive': 'Duration days must be a positive integer.',
    'any.required': 'Duration days is a required field.',
  }),
  features: Joi.array()
    .items(Joi.string().trim().required())
    .required()
    .messages({
      'array.base': 'Features must be an array of strings.',
      'any.required': 'Features array is a required field.',
    }),
  price: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Price must be a valid number.',
    'number.positive': 'Price must be a positive number.',
    'any.required': 'Price is a required field.',
  }),
  isDeleted: Joi.boolean().default(false).optional(),
  autoRenew: Joi.boolean().default(false).optional(),
});

// Schema for updating an existing subscription tier (All fields optional)
const updateSubscriptionTierSchema = Joi.object({
  name: Joi.string().trim().optional(),
  description: Joi.string().trim().allow(null, '').optional(),
  stripePriceId: Joi.string().trim().allow(null, '').optional(),
  durationDays: Joi.number().integer().positive().optional(),
  features: Joi.array().items(Joi.string().trim().required()).optional(),
  price: Joi.number().positive().precision(2).optional(),
  isDeleted: Joi.boolean().optional(),
  autoRenew: Joi.boolean().default(false).optional(),
}).min(1); // Ensures at least one field is passed when executing an update query

module.exports = {
  createSubscriptionTierSchema,
  updateSubscriptionTierSchema,
};

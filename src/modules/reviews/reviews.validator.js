const Joi = require('joi');

const ratingSchema = Joi.number().integer().min(1).max(5).messages({
  'number.base': 'Rating must be a valid number.',
  'number.integer': 'Rating must be a whole number.',
  'number.min': 'Rating cannot be less than 1.',
  'number.max': 'Rating cannot be greater than 5.',
  'any.required': 'Rating is a required field.',
});

const commentSchema = Joi.string().trim().max(1000).allow('', null).messages({
  'string.max': 'Comment cannot exceed 1000 characters.',
});

const createReviewSchema = Joi.object({
  rating: ratingSchema.required(),
  comment: commentSchema.optional(),
  surgeonProfileId: Joi.string().trim().required().messages({
    'string.empty': 'Surgeon Profile ID cannot be empty.',
    'any.required': 'Surgeon Profile ID is required.',
  }),
});

const updateReviewSchema = Joi.object({
  rating: ratingSchema.optional(),
  comment: commentSchema.optional(),
}).min(1);

module.exports = {
  createReviewSchema,
  updateReviewSchema,
};

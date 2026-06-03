const Joi = require('joi');

const createClinicSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  cityId: Joi.string().required(),
});

const updateClinicSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
}).min(1);

module.exports = {
  createClinicSchema,
  updateClinicSchema,
};

const Joi = require('joi');

const createProvinciaSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  regionId: Joi.string().trim().required(),
  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
});

const updateProvinciaSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  regionId: Joi.string().trim().optional(),
  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
}).min(1);

module.exports = {
  createProvinciaSchema,
  updateProvinciaSchema,
};

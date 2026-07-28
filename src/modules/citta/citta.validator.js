const Joi = require('joi');

const createCittaSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  provinceId: Joi.string().trim().required(),
  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
});

const updateCittaSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  provinceId: Joi.string().trim().optional(),
  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
}).min(1);

module.exports = {
  createCittaSchema,
  updateCittaSchema,
};

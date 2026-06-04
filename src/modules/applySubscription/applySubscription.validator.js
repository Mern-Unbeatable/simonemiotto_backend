const Joi = require('joi');

const updateSubscriptionSchema = Joi.object({
  subscriptionPlanId: Joi.string().trim().required(),
  promoCode: Joi.string().trim().uppercase().allow(null, '').optional(),
});

module.exports = { updateSubscriptionSchema };

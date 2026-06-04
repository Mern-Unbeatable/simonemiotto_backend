const Joi = require('joi');

const updateSubscriptionSchema = Joi.object({
  subscriptionPlanId: Joi.string().trim().required(),
  promoCode: Joi.string().trim().uppercase().allow(null, '').optional(),
});

const updateAutoRenewSubscriptionSchema = Joi.object({
  subscriptionId: Joi.string().trim().required(),
  autoRenew: Joi.boolean().required(),
});

module.exports = {
  updateSubscriptionSchema,
  updateAutoRenewSubscriptionSchema,
};

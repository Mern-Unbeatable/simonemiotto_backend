const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth');
const {
  validate,
  validateParams,
  IdParamSchema,
} = require('../../validators/common.validator');

const {
  createPromoCodeSchema,
  useForValidation,
  updateSubscriptionSchema,
  updateAutoRenewSubscriptionSchema,
} = require('./applySubscription.validator');
const ApplySubscriptionController = require('./applySubscription.controller');

const router = express.Router();
const controller = new ApplySubscriptionController();

router.post(
  '/apply',
  authenticate,
  authorize(['SURGEON']),
  validate(updateSubscriptionSchema),
  controller.applySubscription,
);

router.post(
  '/auto-renew',
  authenticate,
  authorize(['SURGEON']),
  validate(updateAutoRenewSubscriptionSchema),
  controller.toggleAutoRenew,
);

module.exports = router;

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
} = require('./applySubscription.validator');
const ApplySubscriptionController = require('./applySubscription.controller');

const router = express.Router();
const controller = new ApplySubscriptionController();

router.post(
  '/',
  authenticate,
  authorize(['SURGEON']),
  validate(updateSubscriptionSchema),
  controller.applySubscription,
);

module.exports = router;

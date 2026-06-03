const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth');
const {
  validate,
  validateParams,
  IdParamSchema,
} = require('../../validators/common.validator');
const SubscriptionPlanController = require('./subscriptionPlan.controller');
const {
  createSubscriptionTierSchema,
  updateSubscriptionTierSchema,
} = require('./subscriptionPlan.validator');

const router = express.Router();
const controller = new SubscriptionPlanController();

router.post(
  '/',
  authenticate,
  authorize(['ADMIN']),
  validate(createSubscriptionTierSchema),
  controller.createSubscriptionPlan,
);

router.get('/', controller.getSubscriptionPlans);

router.get(
  '/:id',
  validateParams(IdParamSchema),
  controller.getSubscriptionPlanById,
);

router.patch(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  validateParams(IdParamSchema),
  validate(updateSubscriptionTierSchema),
  controller.updateSubscriptionPlan,
);

router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  validateParams(IdParamSchema),
  controller.deleteSubscriptionPlan,
);

module.exports = router;

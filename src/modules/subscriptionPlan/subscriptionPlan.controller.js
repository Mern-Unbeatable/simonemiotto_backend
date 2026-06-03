const { asyncHandler } = require('../../middlewares/errorHandler');
const SubscriptionPlanService = require('./subscriptionPlan.services');

class SubscriptionPlanController {
  constructor() {
    this.subscriptionPlanService = new SubscriptionPlanService();
  }

  createSubscriptionPlan = asyncHandler(async (req, res) => {
    const dto = req.body;
    const result =
      await this.subscriptionPlanService.createSubscriptionPlan(dto);
    res.sendCreated(result, 'Subscription plan created successfully');
  });

  getSubscriptionPlans = asyncHandler(async (req, res) => {
    const result = await this.subscriptionPlanService.getSubscriptionPlans();
    res.sendSuccess(result, 'Subscription plans retrieved successfully');
  });

  getSubscriptionPlanById = asyncHandler(async (req, res) => {
    const result = await this.subscriptionPlanService.getSubscriptionPlanById(
      req.params.id,
    );
    res.sendSuccess(result, 'Subscription plan retrieved successfully');
  });

  updateSubscriptionPlan = asyncHandler(async (req, res) => {
    const dto = req.body;
    const result = await this.subscriptionPlanService.updateSubscriptionPlan(
      req.params.id,
      dto,
    );
    res.sendSuccess(result, 'Subscription plan updated successfully');
  });

  deleteSubscriptionPlan = asyncHandler(async (req, res) => {
    await this.subscriptionPlanService.deleteSubscriptionPlan(req.params.id);
    res.sendSuccess(null, 'Subscription plan deleted successfully');
  });
}

module.exports = SubscriptionPlanController;

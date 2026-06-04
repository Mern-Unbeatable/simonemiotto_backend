const { asyncHandler, AppError } = require('../../middlewares/errorHandler');
const ApplySubscriptionService = require('./applySubscription.services');

class ApplySubscriptionController {
  constructor() {
    this.service = new ApplySubscriptionService();
  }
  applySubscription = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const result = await this.service.planUpdate(userId, req.body);
    res.sendCreated(result, 'subscription plan update successfully.');
  });

  toggleAutoRenew = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { subscriptionId, autoRenew } = req.body;
    const result = await this.service.toggleAutoRenew(
      userId,
      subscriptionId,
      autoRenew,
    );
    res.sendCreated(
      result,
      'subscription plan auto renew update successfully.',
    );
  });
}

module.exports = ApplySubscriptionController;

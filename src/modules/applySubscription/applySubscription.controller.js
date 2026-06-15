const { asyncHandler, AppError } = require('../../middlewares/errorHandler');
const PaymentService = require('../payment/payment.services');
const ApplySubscriptionService = require('./applySubscription.services');

class ApplySubscriptionController {
  constructor() {
    this.service = new ApplySubscriptionService();
    this.paymentService = new PaymentService();
  }
  applySubscription = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const result = await this.service.planUpdate(userId, req.body);
    res.sendCreated(result, 'subscription plan update successfully.');
  });

  getSessionDetails = asyncHandler(async (req, res) => {
    const { sessionId } = req.query;
    const result = await this.paymentService.getSessionDetails(sessionId);
    res.sendSuccess(result, 'subscription status retrieved successfully.');
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

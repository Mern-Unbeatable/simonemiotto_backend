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
}

module.exports = ApplySubscriptionController;

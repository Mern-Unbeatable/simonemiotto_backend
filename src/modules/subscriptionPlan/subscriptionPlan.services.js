const { prisma } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

class SubscriptionPlanService {
  async createSubscriptionPlan(data) {
    return prisma.subscriptionTier.create({
      data: {
        ...data,
      },
    });
  }

  async getSubscriptionPlans() {
    return prisma.subscriptionTier.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getSubscriptionPlanById(id) {
    const plan = await prisma.subscriptionTier.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new AppError('Subscription plan not found', 404);
    }

    return plan;
  }

  async updateSubscriptionPlan(id, data) {
    await this.getSubscriptionPlanById(id);

    return prisma.subscriptionTier.update({
      where: { id },
      data: {
        ...data,
      },
    });
  }

  async deleteSubscriptionPlan(id) {
    await this.getSubscriptionPlanById(id);
    await prisma.subscriptionTier.update({
      where: { id },
      data: { isDeleted: true },
    });

    return true;
  }
}

module.exports = SubscriptionPlanService;

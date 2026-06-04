const { prisma } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');
const PaymentService = require('../payment/payment.services');

class ApplySubscriptionService {
  constructor() {
    this.paymentService = new PaymentService();
  }

  async planUpdate(userId, data) {
    const { subscriptionPlanId, promoCode } = data;

    const surgeonProfile = await prisma.surgeonProfile.findUnique({
      where: { userId },
      include: { user: true, currentSubscription: true },
    });

    if (!surgeonProfile) {
      throw new AppError('Surgeon profile not found', 404);
    }

    const subscriptionPlan = await prisma.subscriptionTier.findUnique({
      where: { id: subscriptionPlanId },
    });

    if (!subscriptionPlan) {
      throw new AppError('Subscription plan not found', 404);
    }

    let appliedPromo = null;
    if (promoCode) {
      appliedPromo = await prisma.promoCode.findFirst({
        where: {
          code: promoCode.toUpperCase().trim(),
          OR: [
            { subscriptionTierId: subscriptionPlanId },
            { subscriptionTierId: null },
          ],
          expiryDate: { gt: new Date() },
        },
      });

      if (!appliedPromo) {
        throw new AppError('Invalid or expired promo code', 400);
      }
    }

    let amount = Number(subscriptionPlan.price);
    let daysToAdd = parseInt(subscriptionPlan.durationDays, 10);

    if (appliedPromo) {
      if (appliedPromo.offerType === 'DISCOUNT') {
        amount = amount - (amount * Number(appliedPromo.offerValue)) / 100;
      } else if (appliedPromo.offerType === 'EXTRA_DAYS') {
        daysToAdd += parseInt(appliedPromo.offerValue, 10);
      } else if (appliedPromo.offerType === 'FREE_ACCESS') {
        amount = 0;
      }
    }

    if (amount > 0) {
      return await this.paymentService.createSubscriptionUpdateSession({
        profileData: {
          ...surgeonProfile,
          email: surgeonProfile.user?.email,
        },
        amount,
        subscriptionPlan,
        promoCodeId: appliedPromo ? appliedPromo.id : null,
        daysToAdd,
      });
    } else {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + daysToAdd);

      return await prisma.$transaction(async (tx) => {
        if (appliedPromo) {
          await tx.promoCode.update({
            where: { id: appliedPromo.id },
            data: { usesCount: { increment: 1 } },
          });
        }

        const subscription = await tx.subscription.create({
          data: {
            surgeonProfileId: surgeonProfile.id,
            subscriptionTierId: subscriptionPlan.id,
            promoCodeId: appliedPromo ? appliedPromo.id : null,
            status: 'ACTIVE',
            startDate,
            endDate,
            autoRenew: false,
          },
        });
        await tx.surgeonProfile.update({
          where: { id: surgeonProfile.id },
          data: {
            currentSubscriptionId: subscription.id,
            paymentStatus: 'ACTIVE',
          },
        });

        return {
          requiresPayment: false,
          message: 'Free subscription plan activated successfully',
          expiresAt: endDate,
        };
      });
    }
  }
}

module.exports = ApplySubscriptionService;

const { prisma } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

class PromoCodeService {
  generateRandomCouponCode(baseName) {
    const cleanBase = baseName
      .toUpperCase()
      .trim()
      .replace(/[^A-Z0-9]/g, '');
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '23456789';
    const combinedPool = letters + numbers;
    const char1 = letters[Math.floor(Math.random() * letters.length)];
    const char2 = numbers[Math.floor(Math.random() * numbers.length)];
    const char3 = combinedPool[Math.floor(Math.random() * combinedPool.length)];
    const char4 = combinedPool[Math.floor(Math.random() * combinedPool.length)];
    const suffixArray = [char1, char2, char3, char4].sort(
      () => Math.random() - 0.5,
    );
    const randomSuffix = suffixArray.join('');
    return `${cleanBase}-${randomSuffix}`;
  }

  async createPromoCode(data) {
    const {
      codeName,
      offerType,
      offerValue,
      expiryDate,
      usageLimit,
      subscriptionTierId,
    } = data;

    let finalUniqueCode;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      finalUniqueCode = this.generateRandomCouponCode(codeName);

      const existingCode = await prisma.promoCode.findUnique({
        where: { code: finalUniqueCode },
        select: { id: true },
      });

      if (!existingCode) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new AppError(
        'Failed to generate a unique promo code after multiple attempts. Please try again.',
        400,
      );
    }

    const result = await prisma.promoCode.create({
      data: {
        code: finalUniqueCode,
        offerType,
        offerValue: offerType === 'FREE_ACCESS' ? 0 : offerValue,
        expiryDate: new Date(expiryDate),
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        subscriptionTierId: subscriptionTierId || null,
      },
      include: {
        tier: { select: { name: true } },
      },
    });
    return {
      code: result.code,
      offerType: result.offerType,
    };
  }

  async validatePromoCode(code, targetTierId) {
    const promo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
      include: { tier: true },
    });

    if (!promo) throw new AppError('Invalid promo code.', 404);

    if (promo.expiryDate && new Date() > new Date(promo.expiryDate)) {
      throw new AppError('This promo code has expired.', 400);
    }

    if (promo.usageLimit && promo.usesCount >= promo.usageLimit) {
      throw new AppError(
        'This promo code has reached its maximum usage limit.',
        400,
      );
    }

    if (promo.subscriptionTierId && promo.subscriptionTierId !== targetTierId) {
      throw new AppError(
        'This promo code cannot be applied to this subscription plan.',
        400,
      );
    }

    return promo;
  }
}

module.exports = PromoCodeService;

const { asyncHandler, AppError } = require('../../middlewares/errorHandler');
const PromoCodeService = require('./promo.services');

class PromoCodeController {
  constructor() {
    this.promoCodeService = new PromoCodeService();
  }
  createCode = asyncHandler(async (req, res) => {
    const result = await this.promoCodeService.createPromoCode(req.body);
    res.sendCreated(result, 'Promo code generated successfully.');
  });

  validateCode = asyncHandler(async (req, res) => {
    const { code, subscriptionTierId } = req.body;

    if (!code) {
      throw new AppError('Promo code is required for validation.', 400);
    }

    const verifiedPromo = await this.promoCodeService.validatePromoCode(
      code,
      subscriptionTierId,
    );
    res.sendCreated(verifiedPromo, 'Promo code validated successfully.');
  });

  sendEmailForPromoCode = asyncHandler(async (req, res) => {
    const result = await this.promoCodeService.sendEmailForPromoCode(req.body);
    res.sendCreated(result, 'Email sent successfully (simulated).');
  });
}

module.exports = PromoCodeController;

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
  sendEmailSchema,
} = require('./promo.validator');
const PromoCodeController = require('./promo.controller');

const router = express.Router();
const controller = new PromoCodeController();

router.post(
  '/',
  authenticate,
  authorize(['ADMIN']),
  validate(createPromoCodeSchema),
  controller.createCode,
);

router.post(
  '/send-email',
  authenticate,
  authorize(['ADMIN']),
  validate(sendEmailSchema),
  controller.sendEmailForPromoCode,
);

router.post('/verify', validate(useForValidation), controller.validateCode);

module.exports = router;

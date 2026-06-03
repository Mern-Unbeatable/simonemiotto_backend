const PaymentController = require('./payment.controller');
const express = require('express');
const router = express.Router();

const controller = new PaymentController();

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  controller.stripeWebhookHandler,
);

module.exports = router;

const Stripe = require('stripe');
const { asyncHandler } = require('../../middlewares/errorHandler');
const PaymentService = require('./payment.services');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class PaymentController {
  constructor() {
    this.paymentService = new PaymentService();
  }

  stripeWebhookHandler = asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.metadata?.isPaidRegistration === 'true') {
          try {
            await this.paymentService.handleSuccessfulRegistrationPayment(
              session,
            );
            console.log(
              `User and Vendor Profile successfully created for ${session.customer_email}`,
            );
          } catch (error) {
            console.error(`DB Error during webhook execution:`, error);
            return res.status(500).send('Internal Server Error');
          }
        } else if (session.metadata?.isPlanUpdate === 'true') {
          try {
            await this.paymentService.handleSuccessfulPlanUpdate(session);
            console.log(
              `Subscription successfully upgraded for Vendor ID: ${session.metadata.vendorId}`,
            );
          } catch (error) {
            console.error(`DB Error during plan update webhook:`, error);
            return res.status(500).send('Internal Server Error');
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });
}

module.exports = PaymentController;

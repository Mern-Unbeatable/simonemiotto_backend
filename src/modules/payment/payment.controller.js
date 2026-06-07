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
          console.log('console');
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

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          try {
            await this.paymentService.handleSubscriptionRenewal(invoice);
            console.log(
              `Subscription successfully renewed for Customer: ${invoice.customer}`,
            );
          } catch (error) {
            console.error(`DB Error during subscription renewal:`, error);
            return res.status(500).send('Internal Server Error');
          }
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        try {
          await this.paymentService.handleSubscriptionUpdate(subscription);
          console.log(
            `Subscription updated for: ${subscription.id}. Status: ${subscription.status}`,
          );
        } catch (error) {
          console.error(`DB Error during subscription update webhook:`, error);
          return res.status(500).send('Internal Server Error');
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        try {
          await this.paymentService.handleSubscriptionCancellation(
            subscription,
          );
          console.log(
            `Subscription deleted/expired for Subscription ID: ${subscription.id}`,
          );
        } catch (error) {
          console.error(`DB Error during subscription deletion:`, error);
          return res.status(500).send('Internal Server Error');
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

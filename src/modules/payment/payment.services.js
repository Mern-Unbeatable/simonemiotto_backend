const Stripe = require('stripe');
const { prisma } = require('../../config/database');
const emailEmitter = require('../../utils/eventEmitter');
const { AppError } = require('../../middlewares/errorHandler');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  async createSubscriptionUpdateSession({
    profileData,
    amount,
    subscriptionPlan,
    promoCodeId,
    daysToAdd,
  }) {
    let stripeCustomerId = profileData?.currentSubscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: profileData.email,
        name: profileData.name,
        metadata: {
          surgeonProfileId: profileData.id,
          userId: profileData.userId,
        },
      });
      stripeCustomerId = customer.id;
    }

    const planDays = parseInt(daysToAdd, 10) || 30;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Subscribe to ${subscriptionPlan.name}`,
              description: `Plan access valid for ${daysToAdd} days`,
            },
            unit_amount: Math.round(Number(amount) * 100),
            recurring: {
              interval: 'day',
              interval_count: planDays,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        isPlanUpdate: 'true',
        surgeonProfileId: profileData.id,
        subscriptionTierId: subscriptionPlan.id,
        subscriptionPlanName: subscriptionPlan.name,
        promoCodeId: promoCodeId || '',
        durationDays: String(daysToAdd),
        totalAmount: String(amount),
      },
      success_url: `${process.env.FRONTEND_URL}/surgeon/payment-success?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/surgeon/payment-failed?canceled=true`,
    });

    return {
      requiresPayment: true,
      url: session.url,
    };
  }

  async handleSuccessfulPlanUpdate(session) {
    const meta = session.metadata;
    const stripeSubscriptionId = session.subscription;
    const targetIntentId = session.invoice || session.id;

    if (targetIntentId) {
      const existingPayment = await prisma.payment.findUnique({
        where: { gatewayTxnId: targetIntentId },
      });

      if (existingPayment) {
        console.log(
          `[Webhook] Transaction ${targetIntentId} already processed. Skipping to prevent duplication.`,
        );
        return;
      }
    }

    const startDate = new Date();
    const endDate = new Date();

    if (meta && meta.durationDays) {
      endDate.setDate(startDate.getDate() + parseInt(meta.durationDays, 10));
    } else {
      endDate.setDate(startDate.getDate() + 30);
    }

    await prisma.$transaction(async (tx) => {
      if (meta && meta.promoCodeId) {
        await tx.promoCode.update({
          where: { id: meta.promoCodeId },
          data: { usesCount: { increment: 1 } },
        });
      }

      const existingActiveProfile = await tx.surgeonProfile.findUnique({
        where: { id: meta.surgeonProfileId },
        select: { currentSubscriptionId: true },
      });

      if (existingActiveProfile?.currentSubscriptionId) {
        await tx.subscription.update({
          where: { id: existingActiveProfile.currentSubscriptionId },
          data: { status: 'EXPIRED' },
        });
      }

      // C. Record the new subscription instance inside your database
      const newSubscription = await tx.subscription.create({
        data: {
          surgeonProfileId: meta.surgeonProfileId,
          subscriptionTierId: meta.subscriptionTierId,
          promoCodeId: meta.promoCodeId || null,
          status: 'ACTIVE',
          stripeSubscriptionId: stripeSubscriptionId,
          stripeCustomerId: session.customer,
          startDate,
          endDate,
          autoRenew: true,
        },
      });

      await tx.surgeonProfile.update({
        where: { id: meta.surgeonProfileId },
        data: {
          currentSubscriptionId: newSubscription.id,
          paymentStatus: 'ACTIVE',
        },
      });

      await tx.payment.create({
        data: {
          subscriptionId: newSubscription.id,
          amount: (session.amount_total || 0) / 100,
          currency: (session.currency || 'USD').toUpperCase(),
          status: 'SUCCESS',
          method: 'STRIPE',
          gatewayTxnId: targetIntentId,
          metadata: {
            stripeCustomerId: session.customer,
            checkoutSessionId: session.id,
            invoiceId: session.invoice,
          },
        },
      });
    });

    emailEmitter.emit('subscription-confirmed', {
      userData: {
        name: session.customer_details?.name || 'Valued Customer',
        email: session.customer_details?.email || '',
      },
      subscriptionDetails: {
        planName: `Subscription Plan : ${meta.subscriptionPlanName || 'N/A'}`,
        invoiceId: session.invoice || 'N/A',
        amount: (session.amount_total || 0) / 100,
        renewalDate: endDate.toDateString(),
      },
    });

    console.log(
      `[Webhook] Successfully activated subscription ${meta.subscriptionTierId} for surgeon ${meta.surgeonProfileId}`,
    );
  }

  async handleSubscriptionRenewal(invoice) {
    const stripeSubscriptionId = invoice.subscription;
    if (!stripeSubscriptionId) {
      console.warn('[Webhook] Renewal event received without subscription id');
      return;
    }

    const gatewayTxnId = invoice.payment_intent || invoice.id;

    if (gatewayTxnId) {
      const existingPayment = await prisma.payment.findUnique({
        where: { gatewayTxnId },
      });

      if (existingPayment) {
        console.log(
          `[Webhook] Renewal transaction ${gatewayTxnId} already processed. Skipping duplicate event.`,
        );
        return;
      }
    }

    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId },
      select: {
        id: true,
        surgeonProfileId: true,
        endDate: true,
      },
    });

    if (!subscription) {
      console.warn(
        `[Webhook] No subscription found for Stripe subscription ${stripeSubscriptionId}`,
      );
      return;
    }

    const renewedStartDate = invoice.lines?.data?.[0]?.period?.start
      ? new Date(invoice.lines.data[0].period.start * 1000)
      : new Date();
    const renewedEndDate = invoice.lines?.data?.[0]?.period?.end
      ? new Date(invoice.lines.data[0].period.end * 1000)
      : (() => {
          const fallback = new Date(subscription.endDate || new Date());
          fallback.setDate(fallback.getDate() + 30);
          return fallback;
        })();

    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          autoRenew: true,
          startDate: renewedStartDate,
          endDate: renewedEndDate,
        },
      });

      await tx.surgeonProfile.update({
        where: { id: subscription.surgeonProfileId },
        data: {
          currentSubscriptionId: subscription.id,
          paymentStatus: 'ACTIVE',
        },
      });

      await tx.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount: Number(invoice.amount_paid || invoice.amount_due || 0) / 100,
          currency: (invoice.currency || 'USD').toUpperCase(),
          status: 'SUCCESS',
          method: 'STRIPE',
          gatewayTxnId,
          metadata: {
            stripeCustomerId: invoice.customer,
            stripeSubscriptionId,
            invoiceId: invoice.id,
          },
        },
      });
    });
  }

  async handleSubscriptionUpdate(subscriptionPayload) {
    const stripeSubscriptionId = subscriptionPayload.id;
    if (!stripeSubscriptionId) {
      console.warn('[Webhook] Update event received without subscription id');
      return;
    }

    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId },
      select: {
        id: true,
        surgeonProfileId: true,
      },
    });

    if (!subscription) {
      console.warn(
        `[Webhook] No subscription found for Stripe subscription update ${stripeSubscriptionId}`,
      );
      return;
    }

    const stripeStatus = (subscriptionPayload.status || '').toLowerCase();
    const isCancelled =
      stripeStatus === 'canceled' || stripeStatus === 'incomplete_expired';
    const isActive = stripeStatus === 'active' || stripeStatus === 'trialing';

    const mappedSubscriptionStatus = isCancelled
      ? 'CANCELLED'
      : isActive
        ? 'ACTIVE'
        : 'EXPIRED';
    const mappedPaymentStatus = isCancelled
      ? 'EXPIRED'
      : isActive
        ? 'ACTIVE'
        : 'UNPAID';

    const updateData = {
      status: mappedSubscriptionStatus,
      autoRenew: !subscriptionPayload.cancel_at_period_end,
    };

    if (subscriptionPayload.current_period_start) {
      updateData.startDate = new Date(
        subscriptionPayload.current_period_start * 1000,
      );
    }

    if (subscriptionPayload.current_period_end) {
      updateData.endDate = new Date(
        subscriptionPayload.current_period_end * 1000,
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscription.id },
        data: updateData,
      });

      await tx.surgeonProfile.update({
        where: { id: subscription.surgeonProfileId },
        data: {
          currentSubscriptionId: isCancelled ? null : subscription.id,
          paymentStatus: mappedPaymentStatus,
        },
      });
    });
  }

  async handleSubscriptionCancellation(subscriptionPayload) {
    const stripeSubscriptionId = subscriptionPayload.id;
    if (!stripeSubscriptionId) {
      console.warn(
        '[Webhook] Cancellation event received without subscription id',
      );
      return;
    }

    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId },
      select: {
        id: true,
        surgeonProfileId: true,
      },
    });

    if (!subscription) {
      console.warn(
        `[Webhook] No subscription found for cancelled Stripe subscription ${stripeSubscriptionId}`,
      );
      return;
    }

    const cancelledAt = subscriptionPayload.canceled_at
      ? new Date(subscriptionPayload.canceled_at * 1000)
      : new Date();

    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELLED',
          autoRenew: false,
          endDate: cancelledAt,
        },
      });

      await tx.surgeonProfile.update({
        where: { id: subscription.surgeonProfileId },
        data: {
          currentSubscriptionId: null,
          paymentStatus: 'EXPIRED',
        },
      });
    });
  }

  async handleUpcomingInvoice(invoicePayload) {
    const stripeSubscriptionId = invoicePayload.subscription;

    if (!stripeSubscriptionId) {
      console.warn(
        '[Webhook] Upcoming invoice event received without subscription id',
      );
      return;
    }

    const userSubscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscriptionId },
      include: { tier: true },
    });

    if (!userSubscription) {
      console.warn(
        `[Webhook] No subscription found in DB for upcoming invoice of sub: ${stripeSubscriptionId}`,
      );
      return;
    }

    const currentDbPriceInCents = Math.round(
      Number(userSubscription.tier.price) * 100,
    );

    if (invoicePayload.amount_due !== currentDbPriceInCents) {
      try {
        const stripeSub =
          await stripe.subscriptions.retrieve(stripeSubscriptionId);
        const subscriptionItemId = stripeSub.items.data[0].id;
        await prisma.$transaction(async (tx) => {
          await stripe.subscriptions.update(stripeSubscriptionId, {
            items: [
              {
                id: subscriptionItemId,
                price_data: {
                  currency: 'eur',
                  product: stripeSub.plan.product,
                  unit_amount: currentDbPriceInCents,
                  recurring: {
                    interval: 'day',
                    interval_count: Number(userSubscription.tier.durationDays),
                  },
                },
              },
            ],
            proration_behavior: 'none',
          });
          await tx.subscription.update({
            where: { id: userSubscription.id },
            data: {
              updatedAt: new Date(),
            },
          });
        });

        console.log(
          `[Webhook] Successfully updated upcoming price to €${userSubscription.tier.price} for sub: ${stripeSubscriptionId}`,
        );
      } catch (error) {
        console.error(
          `[Webhook] Failed to update upcoming invoice for sub ${stripeSubscriptionId}:`,
          error.message,
        );
      }
    } else {
      console.log(
        `[Webhook] Price is already up-to-date (€${userSubscription.tier.price}) for sub: ${stripeSubscriptionId}`,
      );
    }
  }

  async getSessionDetails(session_id) {
    if (!session_id) {
      throw new AppError('Session ID is required', 400);
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ['invoice.payment_intent', 'invoice.charge'],
      });


      const invoice = session.invoice;
      const charge = invoice?.charge;


      if (!invoice) {
        throw new AppError(
          'Payment details not found for this subscription session',
          404,
        );
      }

      let paymentMethodText = 'Card Payment';
      if (charge && charge.payment_method_details?.card) {
        const cardInfo = charge.payment_method_details.card;
        const brand =
          cardInfo.brand.charAt(0).toUpperCase() + cardInfo.brand.slice(1);
        paymentMethodText = `${brand} ending in ${cardInfo.last4}`;
      }

      const customTransactionId = this.generateCustomId();

      const planName =
        session.metadata?.subscriptionPlanName || 'Subscription Plan';
      const durationDays = session.metadata?.durationDays || '';
      const surgeonProfileId = session.metadata?.surgeonProfileId || null;

      return {
        transactionId: customTransactionId,
        amount: (session.amount_total || 0) / 100,
        currency: (session.currency || 'EUR').toUpperCase(),
        paymentMethod: paymentMethodText,
        planName,
        durationDays,
      };
    } catch (error) {
      console.error(
        `Error retrieving session details for ${session_id}:`,
        error,
      );
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to retrieve session details', 500);
    }
  }

  generateCustomId() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const randomSequence = String(Math.floor(100000 + Math.random() * 900000));

    return `TRS-${year}-${month}-${randomSequence}`;
  }
}

module.exports = PaymentService;

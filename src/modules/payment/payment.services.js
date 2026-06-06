const Stripe = require('stripe');
const { prisma } = require('../../config/database');
const emailEmitter = require('../../utils/eventEmitter');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  async createRegistrationCheckoutSession({
    subscriptionPlan,
    vendorData,
    imageUrls,
    hashedPassword,
  }) {
    const {
      name,
      email,
      location,
      businessName,
      experienceYears,
      highlightedServices,
      speciality,
      aboutMe,
      packages,
      packageId,
      categoryId,
      phone,
      cityId,
      stateId,
    } = vendorData;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email.toLowerCase(),
      // line_items: [
      //   {
      //     price: subscriptionPlan.stripePriceId,
      //     quantity: 1,
      //   },
      // ],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Subscribe to Professional Vendor Plan',
            },
            unit_amount: subscriptionPlan.priceMonthly * 100,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],

      metadata: {
        isPaidRegistration: 'true',
        name,
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        businessName,
        location,
        experienceYears,
        speciality,
        aboutMe,
        categoryId,
        phone: phone || '',
        highlightedServices: JSON.stringify(highlightedServices || []),
        imageUrls: JSON.stringify(imageUrls || []),
        packages: JSON.stringify(packages || []),
        packageId: packageId,
        cityId: cityId,
        stateId: stateId,
      },
      success_url: `${process.env.FRONTEND_URL}/registration-success?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
    });

    return {
      requiresPayment: true,
      url: session.url,
    };
  }

  async handleSuccessfulRegistrationPayment(session) {
    const meta = session.metadata;

    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(startsAt.getDate() + 30);

    const highlightedServices = JSON.parse(meta.highlightedServices);
    const imageUrls = JSON.parse(meta.imageUrls);
    const packages = JSON.parse(meta.packages);

    const userExists = await prisma.user.findUnique({
      where: { email: meta.email },
    });
    if (userExists) return;

    const paymentReferenceId = session.payment_intent || session.id;

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: meta.name,
          email: meta.email,
          passwordHash: meta.passwordHash,
          role: 'VENDOR',
          status: 'ACTIVE',
          isActive: true,
          emailVerified: true,
        },
      });

      const vendorProfile = await tx.vendorProfile.create({
        data: {
          userId: user.id,
          businessName: meta.businessName,
          location: meta.location,
          experienceYears: meta.experienceYears,
          speciality: meta.speciality,
          aboutMe: meta.aboutMe,
          categoryId: meta.categoryId,
          phone: meta.phone,
          stripeCustomerId: session.customer,
          highlightedServices,
          cityId: meta.cityId,
          stateId: meta.stateId,
          portfolioImages: {
            create: imageUrls.map((url, index) => ({
              mediaUrl: url,
              sortOrder: index,
            })),
          },
          packages: {
            create: packages.map((pkg) => ({
              packageName: pkg.packageName,
              price: pkg.price,
              badge: pkg.badge || null,
              features: pkg.features || [],
            })),
          },
        },
      });

      const subscription = await tx.vendorSubscription.create({
        data: {
          vendorId: vendorProfile.id,
          planId: meta.packageId,
          status: 'ACTIVE',
          stripeSubscriptionId: session.subscription,
          startsAt,
          endsAt,
        },
      });

      await tx.vendorProfile.update({
        where: { id: vendorProfile.id },
        data: { currentSubscriptionId: subscription.id },
      });

      await tx.payment.create({
        data: {
          vendorId: vendorProfile.id,
          subscriptionId: subscription.id,
          amount: (session.amount_total || 0) / 100,
          status: 'SUCCESS',
          stripeIntentId: paymentReferenceId,
          purchaseDate: new Date(),
        },
      });
    });
  }

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
            currency: 'usd',
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
      success_url: `${process.env.FRONTEND_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/billing?canceled=true`,
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
}

module.exports = PaymentService;

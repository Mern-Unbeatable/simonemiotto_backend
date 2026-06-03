const Stripe = require('stripe');
const { prisma } = require('../../config/database');
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
    vendorId,
    currentSubscription,
    newPlan,
  }) {
    console.log(
      'Creating subscription update session for vendorId:',
      currentSubscription,
    );

    let stripeCustomerId = currentSubscription?.vendor?.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: currentSubscription.vendor.email,
        name: currentSubscription.vendor.name,
        metadata: {
          vendorId: vendorId,
        },
      });

      stripeCustomerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: stripeCustomerId,

      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Subscribe to Professional Vendor Plan',
            },
            unit_amount: Number(newPlan.priceMonthly) * 100,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],

      metadata: {
        isPlanUpdate: 'true',
        vendorId: vendorId,
        oldSubscriptionId: currentSubscription.id,
        newPlanId: newPlan.id,
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
    const stripeInvoiceId = session.invoice;

    // In subscription mode, payment_intent might be null. Fallback to invoice ID to prevent unique constraint crash.
    const targetIntentId =
      session.payment_intent || stripeInvoiceId || session.id;

    // 1. Prevent duplicate processing (Fixes Prisma P2002 Unique Constraint Error)
    if (targetIntentId) {
      const existingPayment = await prisma.payment.findUnique({
        where: { stripeIntentId: targetIntentId },
      });

      // If payment already exists, acknowledge and exit early to prevent duplication
      if (existingPayment) {
        console.log(
          `[Webhook] Payment ${targetIntentId} already processed. Skipping to avoid duplication.`,
        );
        return;
      }
    }

    // 2. Extract precise subscription period dates provided by Stripe (converted from seconds to milliseconds)
    const startsAt = session.current_period_start
      ? new Date(session.current_period_start * 1000)
      : new Date();

    const endsAt = session.current_period_end
      ? new Date(session.current_period_end * 1000)
      : new Date();

    // Fallback to default 30 days if Stripe period end timestamp is not present
    if (!session.current_period_end) {
      endsAt.setDate(startsAt.getDate() + 30);
    }

    // 3. Execute database operations inside a Prisma Transaction
    await prisma.$transaction(async (tx) => {
      // A. Expire the old subscription only if it exists (handles new vendors with no previous plan)
      if (meta.oldSubscriptionId) {
        await tx.vendorSubscription.update({
          where: { id: meta.oldSubscriptionId },
          data: { status: 'EXPIRED' },
        });
      }

      // B. Create the new subscription record
      const newSubscription = await tx.vendorSubscription.create({
        data: {
          vendorId: meta.vendorId,
          planId: meta.newPlanId,
          status: 'ACTIVE',
          stripeSubscriptionId: stripeSubscriptionId,
          startsAt,
          endsAt,
        },
      });

      // C. Update Vendor Profile with the new active subscription ID and sync stripeCustomerId
      await tx.vendorProfile.update({
        where: { id: meta.vendorId },
        data: {
          currentSubscriptionId: newSubscription.id,
          stripeCustomerId: session.customer, // Save or sync the customer ID
        },
      });

      // D. Log the payment history record securely
      await tx.payment.create({
        data: {
          vendorId: meta.vendorId,
          subscriptionId: newSubscription.id,
          amount: (session.amount_total || 0) / 100, // Convert cents to dollars/main currency
          status: 'SUCCESS',
          stripeIntentId: targetIntentId,
          purchaseDate: new Date(),
        },
      });
    });
  }
}

module.exports = PaymentService;

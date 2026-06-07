const cron = require('node-cron');
const { prisma } = require('../config/database');



const initSubscriptionCron = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log(
      '[Cron Automation]: Executing expiration checks for subscriptions...',
    );

    try {
      const now = new Date();

      const expiredSubscriptions = await prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          endDate: {
            lt: now,
          },
        },
        select: {
          id: true,
          surgeonProfileId: true,
        },
      });

      if (expiredSubscriptions.length === 0) {
        console.log('[Cron Automation]: No expired subscriptions found today.');
        return;
      }

      const expiredIds = expiredSubscriptions.map((sub) => sub.id);
      const surgeonProfileIds = expiredSubscriptions.map(
        (sub) => sub.surgeonProfileId,
      );

      await prisma.$transaction([
        prisma.subscription.updateMany({
          where: {
            id: { in: expiredIds },
          },
          data: {
            status: 'EXPIRED',
          },
        }),

        prisma.surgeonProfile.updateMany({
          where: {
            id: { in: surgeonProfileIds },
            currentSubscriptionId: { in: expiredIds },
          },
          data: {
            currentSubscriptionId: null,
          },
        }),
      ]);

      console.log(
        `[Cron Automation]: Successfully expired ${expiredIds.length} subscriptions and cleared profile linkages.`,
      );
    } catch (error) {
      console.error(
        '[Cron Automation Error]: Failed processing scheduled updates:',
        error.message,
      );
    }
  });
};

module.exports = initSubscriptionCron;

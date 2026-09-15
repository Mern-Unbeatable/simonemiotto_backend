const EmailService = require('../../utils/email');
const { prisma } = require('../../config/database');
const {
  buildUserRegistrationContract,
  buildSurgeonSubscriptionContract,
} = require('./contractTemplates');

const emailService = new EmailService();

async function sendUserRegistrationContract(user) {
  if (!user?.email) return;

  const mail = buildUserRegistrationContract({
    name: user.name || 'Utente',
    email: user.email,
    userId: user.id,
    registeredAt: user.createdAt || new Date(),
  });

  await emailService.sendMail(user.email, mail.subject, mail.text, mail.html);
}

/**
 * Sends surgeon contract only when profile is APPROVED and subscription/payment is active.
 */
async function sendSurgeonContractIfEligible(surgeonProfileId, paymentHint = {}) {
  if (!surgeonProfileId) return false;

  const profile = await prisma.surgeonProfile.findUnique({
    where: { id: surgeonProfileId },
    include: {
      user: { select: { name: true, email: true } },
      currentSubscription: {
        include: { tier: true },
      },
    },
  });

  if (!profile) return false;
  if (profile.status !== 'APPROVED') return false;
  if (profile.paymentStatus !== 'ACTIVE') return false;
  if (!profile.currentSubscription || profile.currentSubscription.status !== 'ACTIVE') {
    return false;
  }

  const sub = profile.currentSubscription;
  const start = sub.startDate ? new Date(sub.startDate) : new Date();
  const end = sub.endDate ? new Date(sub.endDate) : new Date();
  const durationDays = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );

  const mail = buildSurgeonSubscriptionContract({
    name: profile.name || profile.user?.name || 'Professionista',
    email: profile.user?.email || '',
    profileId: profile.id,
    planName: sub.tier?.name || paymentHint.planName || '—',
    amount:
      paymentHint.amount !== undefined
        ? paymentHint.amount
        : sub.tier?.price ?? null,
    currency: paymentHint.currency || 'EUR',
    startDate: start,
    endDate: end,
    durationLabel: `${durationDays} giorni`,
  });

  const to = profile.user?.email;
  if (!to) return false;

  await emailService.sendMail(to, mail.subject, mail.text, mail.html);
  return true;
}

module.exports = {
  sendUserRegistrationContract,
  sendSurgeonContractIfEligible,
};

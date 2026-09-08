/**
 * One-off: fix subscription plan feature copy on live/local DB.
 * - Correct Chinese typo in "Verifica identità accelerata"
 * - Clarify vague "Profilo premium" wording
 *
 * Run: node fixSubscriptionFeatures.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const FEATURE_REPLACEMENTS = [
  { from: /Verifica identità.*ata/u, to: 'Verifica identità accelerata' },
  { from: /^Profilo premium$/u, to: 'Profilo chirurgo completo' },
];

async function main() {
  const plans = await prisma.subscriptionTier.findMany();
  console.log(`Found ${plans.length} subscription plan(s)\n`);

  for (const plan of plans) {
    const features = Array.isArray(plan.features) ? [...plan.features] : [];
    let changed = false;

    const next = features.map((feature) => {
      let value = String(feature);
      for (const { from, to } of FEATURE_REPLACEMENTS) {
        if (from.test(value)) {
          if (value !== to) {
            console.log(`  [${plan.name}] "${value}" → "${to}"`);
            changed = true;
          }
          value = to;
        }
      }
      // Explicit fix for mixed Chinese characters if regex missed edge cases
      if (value.includes('加速')) {
        console.log(`  [${plan.name}] fixing Chinese chars in: "${value}"`);
        value = 'Verifica identità accelerata';
        changed = true;
      }
      return value;
    });

    if (changed) {
      await prisma.subscriptionTier.update({
        where: { id: plan.id },
        data: { features: next },
      });
      console.log(`  ✅ Updated plan: ${plan.name}\n`);
    } else {
      console.log(`  ⏭️  No change: ${plan.name}`);
    }
  }

  console.log('\nDone.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

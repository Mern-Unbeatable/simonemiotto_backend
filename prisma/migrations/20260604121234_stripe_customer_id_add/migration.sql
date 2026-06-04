-- DropIndex
DROP INDEX "Subscription_stripeSubscriptionId_key";

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "stripeCustomerId" TEXT;

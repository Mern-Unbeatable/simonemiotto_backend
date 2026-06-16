-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT;

-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "verifiedBadge" BOOLEAN NOT NULL DEFAULT false;

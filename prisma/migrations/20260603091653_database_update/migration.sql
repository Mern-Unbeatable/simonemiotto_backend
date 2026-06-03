/*
  Warnings:

  - You are about to drop the column `userId` on the `Subscription` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[currentSubscriptionId]` on the table `SurgeonProfile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `surgeonProfileId` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_userId_fkey";

-- DropIndex
DROP INDEX "Subscription_userId_idx";

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "userId",
ADD COLUMN     "autoRenew" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "surgeonProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SurgeonProfile" ADD COLUMN     "currentSubscriptionId" TEXT;

-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "autoRenew" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Subscription_surgeonProfileId_idx" ON "Subscription"("surgeonProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "SurgeonProfile_currentSubscriptionId_key" ON "SurgeonProfile"("currentSubscriptionId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_surgeonProfileId_fkey" FOREIGN KEY ("surgeonProfileId") REFERENCES "SurgeonProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurgeonProfile" ADD CONSTRAINT "SurgeonProfile_currentSubscriptionId_fkey" FOREIGN KEY ("currentSubscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `SurgeonProfile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `subscription_plans` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `SurgeonProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SurgeonProfile" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SurgeonProfile_slug_key" ON "SurgeonProfile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_name_key" ON "subscription_plans"("name");

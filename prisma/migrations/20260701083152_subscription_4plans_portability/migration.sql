/*
  Warnings:

  - The values [MENSUEL,ANNUEL] on the enum `Plan` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Plan_new" AS ENUM ('STANDARD_MENSUEL', 'STANDARD_ANNUEL', 'FULLIA_MENSUEL', 'FULLIA_ANNUEL');
ALTER TABLE "Subscription" ALTER COLUMN "plan" TYPE "Plan_new" USING ("plan"::text::"Plan_new");
ALTER TYPE "Plan" RENAME TO "Plan_old";
ALTER TYPE "Plan_new" RENAME TO "Plan";
DROP TYPE "public"."Plan_old";
COMMIT;

-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'INCOMPLETE';

-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN     "aiHandoffDelaySec" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "portabilityCode" TEXT,
ADD COLUMN     "portabilityCountry" TEXT NOT NULL DEFAULT 'FR';

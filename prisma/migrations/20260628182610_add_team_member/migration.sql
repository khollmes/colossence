-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('STANDARD', 'NIGHT_SURCHARGE', 'HOLIDAY_SURCHARGE', 'TRAVEL');

-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN     "nightEndTime" TEXT NOT NULL DEFAULT '08:00',
ADD COLUMN     "nightStartTime" TEXT NOT NULL DEFAULT '18:00';

-- CreateTable
CREATE TABLE "PricingItem" (
    "id" TEXT NOT NULL,
    "businessProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "type" "PricingType" NOT NULL DEFAULT 'STANDARD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnCallSlot" (
    "id" TEXT NOT NULL,
    "businessProfileId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnCallSlot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PricingItem" ADD CONSTRAINT "PricingItem_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnCallSlot" ADD CONSTRAINT "OnCallSlot_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnCallSlot" ADD CONSTRAINT "OnCallSlot_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "CallOutcome" AS ENUM ('APPOINTMENT', 'MESSAGE', 'TRANSFERRED', 'MISSED');

-- CreateTable
CREATE TABLE "CallLog" (
    "id" TEXT NOT NULL,
    "businessProfileId" TEXT NOT NULL,
    "callerNumber" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "outcome" "CallOutcome" NOT NULL,
    "transcript" JSONB,
    "audioUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `feedback` on the `InterviewStep` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "InterviewSession" ADD COLUMN     "status" "InterviewStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "totalTimeSec" INTEGER;

-- AlterTable
ALTER TABLE "InterviewStep" DROP COLUMN "feedback",
ADD COLUMN     "answerDurationSec" INTEGER,
ADD COLUMN     "criteria" TEXT[],
ADD COLUMN     "estimatedAnswerTimeSec" INTEGER,
ADD COLUMN     "improvements" TEXT[],
ADD COLUMN     "rationale" TEXT,
ADD COLUMN     "redFlags" TEXT[],
ADD COLUMN     "skills" TEXT[],
ADD COLUMN     "strengths" TEXT[];

-- CreateTable
CREATE TABLE "CriterionEvaluation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "interviewStepId" TEXT NOT NULL,

    CONSTRAINT "CriterionEvaluation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CriterionEvaluation" ADD CONSTRAINT "CriterionEvaluation_interviewStepId_fkey" FOREIGN KEY ("interviewStepId") REFERENCES "InterviewStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

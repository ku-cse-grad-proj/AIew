/*
  Warnings:

  - You are about to drop the column `questions` on the `InterviewSession` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('TECHNICAL', 'PERSONALITY', 'TAILORED');

-- DropForeignKey
ALTER TABLE "InterviewSession" DROP CONSTRAINT "InterviewSession_userId_fkey";

-- AlterTable
ALTER TABLE "InterviewSession" DROP COLUMN "questions",
ADD COLUMN     "finalFeedback" TEXT;

-- CreateTable
CREATE TABLE "InterviewStep" (
    "id" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "feedback" TEXT,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "interviewSessionId" TEXT NOT NULL,
    "parentStepId" TEXT,

    CONSTRAINT "InterviewStep_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewStep" ADD CONSTRAINT "InterviewStep_interviewSessionId_fkey" FOREIGN KEY ("interviewSessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewStep" ADD CONSTRAINT "InterviewStep_parentStepId_fkey" FOREIGN KEY ("parentStepId") REFERENCES "InterviewStep"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

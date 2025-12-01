/*
  Warnings:

  - Added the required column `aiQuestionId` to the `InterviewStep` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InterviewStep" ADD COLUMN     "aiQuestionId" TEXT NOT NULL;

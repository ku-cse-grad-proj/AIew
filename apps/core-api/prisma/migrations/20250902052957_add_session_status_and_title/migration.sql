/*
  Warnings:

  - The `status` column on the `InterviewSession` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[userId,title]` on the table `InterviewSession` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `title` to the `InterviewSession` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InterviewSessionStatus" AS ENUM ('PENDING', 'READY', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "InterviewSession" ADD COLUMN     "title" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "InterviewSessionStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "InterviewStatus";

-- CreateIndex
CREATE UNIQUE INDEX "InterviewSession_userId_title_key" ON "InterviewSession"("userId", "title");

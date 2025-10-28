-- CreateTable
CREATE TABLE "EmotionAnalysis" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interviewStepId" TEXT NOT NULL,

    CONSTRAINT "EmotionAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmotionFrame" (
    "id" TEXT NOT NULL,
    "frame" INTEGER NOT NULL,
    "time" DOUBLE PRECISION NOT NULL,
    "happy" DOUBLE PRECISION NOT NULL,
    "sad" DOUBLE PRECISION NOT NULL,
    "neutral" DOUBLE PRECISION NOT NULL,
    "angry" DOUBLE PRECISION NOT NULL,
    "fear" DOUBLE PRECISION NOT NULL,
    "surprise" DOUBLE PRECISION NOT NULL,
    "emotionAnalysisId" TEXT NOT NULL,

    CONSTRAINT "EmotionFrame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmotionAnalysis_interviewStepId_key" ON "EmotionAnalysis"("interviewStepId");

-- AddForeignKey
ALTER TABLE "EmotionAnalysis" ADD CONSTRAINT "EmotionAnalysis_interviewStepId_fkey" FOREIGN KEY ("interviewStepId") REFERENCES "InterviewStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmotionFrame" ADD CONSTRAINT "EmotionFrame_emotionAnalysisId_fkey" FOREIGN KEY ("emotionAnalysisId") REFERENCES "EmotionAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

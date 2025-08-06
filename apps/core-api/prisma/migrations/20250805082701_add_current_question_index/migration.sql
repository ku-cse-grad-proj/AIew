-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InterviewSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "jobSpec" TEXT NOT NULL,
    "idealTalent" TEXT,
    "coverLetter" TEXT,
    "portfolio" TEXT,
    "questions" JSONB,
    "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "InterviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_InterviewSession" ("company", "coverLetter", "createdAt", "id", "idealTalent", "jobSpec", "jobTitle", "portfolio", "questions", "updatedAt", "userId") SELECT "company", "coverLetter", "createdAt", "id", "idealTalent", "jobSpec", "jobTitle", "portfolio", "questions", "updatedAt", "userId" FROM "InterviewSession";
DROP TABLE "InterviewSession";
ALTER TABLE "new_InterviewSession" RENAME TO "InterviewSession";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

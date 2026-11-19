-- AlterTable
ALTER TABLE "User" ADD COLUMN     "language" TEXT;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "categoryEn" TEXT,
ADD COLUMN     "categoryRu" TEXT,
ADD COLUMN     "channelId" TEXT,
ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "descriptionRu" TEXT,
ADD COLUMN     "durationEn" TEXT,
ADD COLUMN     "durationRu" TEXT,
ADD COLUMN     "levelEn" TEXT,
ADD COLUMN     "levelRu" TEXT,
ADD COLUMN     "programEn" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "programRu" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "titleEn" TEXT,
ADD COLUMN     "titleRu" TEXT;

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "textEn" TEXT,
ADD COLUMN     "textRu" TEXT,
ADD COLUMN     "titleEn" TEXT,
ADD COLUMN     "titleRu" TEXT;

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "username" TEXT,
    "canInvite" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseAccess" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "channelId" TEXT NOT NULL,
    "inviteLink" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseAccess_inviteLink_idx" ON "CourseAccess"("inviteLink");

-- CreateIndex
CREATE UNIQUE INDEX "CourseAccess_userId_courseId_key" ON "CourseAccess"("userId", "courseId");

-- AddForeignKey
ALTER TABLE "CourseAccess" ADD CONSTRAINT "CourseAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAccess" ADD CONSTRAINT "CourseAccess_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;


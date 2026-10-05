-- CreateEnum
CREATE TYPE "CourseFormat" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('NEW', 'CONFIRMED', 'PAID', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "titleRu" TEXT,
    "titleEn" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "descriptionRu" TEXT,
    "descriptionEn" TEXT,
    "program" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "programRu" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "programEn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "duration" TEXT,
    "durationRu" TEXT,
    "durationEn" TEXT,
    "imageUrl" TEXT NOT NULL,
    "onlinePrice" INTEGER,
    "offlinePrice" INTEGER,
    "badge" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "courseId" INTEGER,
    "courseTitle" TEXT NOT NULL,
    "format" "CourseFormat" NOT NULL,
    "price" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "comment" TEXT,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Enrollment_status_idx" ON "Enrollment"("status");

-- CreateIndex
CREATE INDEX "Enrollment_userId_idx" ON "Enrollment"("userId");

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

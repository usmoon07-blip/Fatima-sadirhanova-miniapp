-- CreateEnum
CREATE TYPE "PromoType" AS ENUM ('PERCENT', 'FIXED');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "nameEn" TEXT,
ADD COLUMN     "nameRu" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelledBy" TEXT,
ADD COLUMN     "discount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "promoCode" TEXT,
ADD COLUMN     "statusAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "descriptionRu" TEXT,
ADD COLUMN     "ingredientsEn" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "ingredientsRu" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "nameEn" TEXT,
ADD COLUMN     "nameRu" TEXT;

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "textEn" TEXT,
ADD COLUMN     "textRu" TEXT,
ADD COLUMN     "titleEn" TEXT,
ADD COLUMN     "titleRu" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "descriptionRu" TEXT,
    "descriptionEn" TEXT,
    "type" "PromoType" NOT NULL DEFAULT 'PERCENT',
    "value" INTEGER NOT NULL,
    "maxDiscount" INTEGER,
    "minOrder" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

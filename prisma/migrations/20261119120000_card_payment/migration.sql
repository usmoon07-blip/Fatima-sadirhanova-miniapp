-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "receiptAt" TIMESTAMP(3),
ADD COLUMN     "receiptUrl" TEXT;

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);


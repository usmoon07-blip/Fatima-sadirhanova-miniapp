-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PAID', 'CANCELLED', 'REFUNDED');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "mxik" TEXT,
ADD COLUMN     "packageCode" TEXT,
ADD COLUMN     "vat" INTEGER;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'multicard';

-- Mavjud arizalar eski usulda (kartaga o'tkazma + chek) qilingan
UPDATE "Order" SET "paymentMethod" = 'manual';

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'multicard',
    "invoiceId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "invoiceUuid" TEXT,
    "transactionUuid" TEXT,
    "checkoutUrl" TEXT,
    "receiptUrl" TEXT,
    "cardPan" TEXT,
    "ps" TEXT,
    "billingId" TEXT,
    "paidAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentLog" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'multicard',
    "direction" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "paymentId" INTEGER,
    "httpStatus" INTEGER,
    "request" JSONB,
    "response" JSONB,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_invoiceId_key" ON "Payment"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_invoiceUuid_key" ON "Payment"("invoiceUuid");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionUuid_key" ON "Payment"("transactionUuid");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "PaymentLog_paymentId_idx" ON "PaymentLog"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentLog_createdAt_idx" ON "PaymentLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentLog" ADD CONSTRAINT "PaymentLog_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;


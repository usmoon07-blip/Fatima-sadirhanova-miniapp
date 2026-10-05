-- AlterTable
ALTER TABLE "Order" DROP COLUMN "discount",
DROP COLUMN "promoCode";

-- DropTable
DROP TABLE "PromoCode";

-- DropEnum
DROP TYPE "PromoType";


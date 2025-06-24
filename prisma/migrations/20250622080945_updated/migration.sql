/*
  Warnings:

  - You are about to drop the column `colorId` on the `cart_items` table. All the data in the column will be lost.
  - You are about to drop the column `colorId` on the `package_items` table. All the data in the column will be lost.
  - You are about to drop the `product_colors` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[cartId,productId,packageId]` on the table `cart_items` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_colorId_fkey";

-- DropForeignKey
ALTER TABLE "package_items" DROP CONSTRAINT "package_items_colorId_fkey";

-- DropForeignKey
ALTER TABLE "product_colors" DROP CONSTRAINT "product_colors_colorId_fkey";

-- DropForeignKey
ALTER TABLE "product_colors" DROP CONSTRAINT "product_colors_productId_fkey";

-- DropIndex
DROP INDEX "cart_items_cartId_productId_colorId_packageId_key";

-- AlterTable
ALTER TABLE "cart_items" DROP COLUMN "colorId";

-- AlterTable
ALTER TABLE "package_items" DROP COLUMN "colorId";

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "colorId" TEXT,
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "product_colors";

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cartId_productId_packageId_key" ON "cart_items"("cartId", "productId", "packageId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "colors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

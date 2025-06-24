/*
  Warnings:

  - You are about to drop the column `stock` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "product_colors" ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "stock";

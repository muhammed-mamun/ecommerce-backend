/*
  Warnings:

  - A unique constraint covering the columns `[cartId,productId,colorId,packageId]` on the table `cart_items` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cartId_productId_colorId_packageId_key" ON "cart_items"("cartId", "productId", "colorId", "packageId");

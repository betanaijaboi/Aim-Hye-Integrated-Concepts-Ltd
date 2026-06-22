-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "breweryId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "packSize" INTEGER NOT NULL,
    "pricePerCrate" REAL NOT NULL,
    "pricePerBottle" REAL NOT NULL,
    "depositPerCrate" REAL NOT NULL DEFAULT 0,
    "stockCrates" INTEGER NOT NULL DEFAULT 0,
    "minStockCrates" INTEGER NOT NULL DEFAULT 5,
    "packaging" TEXT NOT NULL DEFAULT 'glass',
    "productFamily" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_breweryId_fkey" FOREIGN KEY ("breweryId") REFERENCES "Brewery" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("breweryId", "category", "createdAt", "depositPerCrate", "id", "imageUrl", "isActive", "minStockCrates", "name", "packSize", "pricePerBottle", "pricePerCrate", "size", "sku", "stockCrates", "updatedAt") SELECT "breweryId", "category", "createdAt", "depositPerCrate", "id", "imageUrl", "isActive", "minStockCrates", "name", "packSize", "pricePerBottle", "pricePerCrate", "size", "sku", "stockCrates", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

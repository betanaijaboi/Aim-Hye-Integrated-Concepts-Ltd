-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN "branch" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CustomerOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNo" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "branch" TEXT NOT NULL DEFAULT 'IKOT_EKPENE',
    "totalAmount" REAL NOT NULL,
    "depositAmount" REAL NOT NULL DEFAULT 0,
    "deliveryAddress" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CustomerOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CustomerOrder" ("createdAt", "customerId", "deliveryAddress", "depositAmount", "id", "notes", "orderNo", "status", "totalAmount", "updatedAt") SELECT "createdAt", "customerId", "deliveryAddress", "depositAmount", "id", "notes", "orderNo", "status", "totalAmount", "updatedAt" FROM "CustomerOrder";
DROP TABLE "CustomerOrder";
ALTER TABLE "new_CustomerOrder" RENAME TO "CustomerOrder";
CREATE UNIQUE INDEX "CustomerOrder_orderNo_key" ON "CustomerOrder"("orderNo");
CREATE TABLE "new_ManagerChangeRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestedById" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'IKOT_EKPENE',
    "currentValue" REAL NOT NULL,
    "proposedValue" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ManagerChangeRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "AdminUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ManagerChangeRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ManagerChangeRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "AdminUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ManagerChangeRequest" ("createdAt", "currentValue", "id", "productId", "proposedValue", "reason", "requestedById", "reviewNote", "reviewedAt", "reviewedById", "status", "type", "updatedAt") SELECT "createdAt", "currentValue", "id", "productId", "proposedValue", "reason", "requestedById", "reviewNote", "reviewedAt", "reviewedById", "status", "type", "updatedAt" FROM "ManagerChangeRequest";
DROP TABLE "ManagerChangeRequest";
ALTER TABLE "new_ManagerChangeRequest" RENAME TO "ManagerChangeRequest";
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
    "branch" TEXT NOT NULL DEFAULT 'IKOT_EKPENE',
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_breweryId_fkey" FOREIGN KEY ("breweryId") REFERENCES "Brewery" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("breweryId", "category", "createdAt", "depositPerCrate", "id", "imageUrl", "isActive", "minStockCrates", "name", "packSize", "packaging", "pricePerBottle", "pricePerCrate", "productFamily", "size", "sku", "stockCrates", "updatedAt") SELECT "breweryId", "category", "createdAt", "depositPerCrate", "id", "imageUrl", "isActive", "minStockCrates", "name", "packSize", "packaging", "pricePerBottle", "pricePerCrate", "productFamily", "size", "sku", "stockCrates", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

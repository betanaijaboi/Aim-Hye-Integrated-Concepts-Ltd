-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CustomerAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "pin" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CustomerAccount" ("createdAt", "email", "emailVerified", "id", "isActive", "name", "password", "phone", "phoneVerified", "pin", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "isActive", "name", "password", "phone", "phoneVerified", "pin", "updatedAt" FROM "CustomerAccount";
DROP TABLE "CustomerAccount";
ALTER TABLE "new_CustomerAccount" RENAME TO "CustomerAccount";
CREATE UNIQUE INDEX "CustomerAccount_phone_key" ON "CustomerAccount"("phone");
CREATE UNIQUE INDEX "CustomerAccount_email_key" ON "CustomerAccount"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

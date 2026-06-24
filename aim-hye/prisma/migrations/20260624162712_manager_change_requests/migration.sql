-- CreateTable
CREATE TABLE "ManagerChangeRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestedById" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
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

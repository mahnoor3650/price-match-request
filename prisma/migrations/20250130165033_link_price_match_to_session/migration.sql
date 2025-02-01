-- CreateTable
CREATE TABLE "PriceMatchRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "customerId" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT,
    "competitorUrl" TEXT NOT NULL,
    "competitorPrice" REAL NOT NULL,
    "ourPrice" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "discountCode" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PriceMatchRequest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PriceMatchRequest_sessionId_key" ON "PriceMatchRequest"("sessionId");

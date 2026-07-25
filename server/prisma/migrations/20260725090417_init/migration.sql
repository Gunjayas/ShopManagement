-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierOrCountry" TEXT NOT NULL,
    "orderDate" DATETIME NOT NULL,
    "transportationFee" REAL NOT NULL,
    "expectedBundleCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ongoing'
);

-- CreateTable
CREATE TABLE "bundles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "designName" TEXT NOT NULL,
    "itemsOrdered" INTEGER NOT NULL,
    "costPerItem" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "itemsReceived" INTEGER,
    "arrivalDate" DATETIME,
    CONSTRAINT "bundles_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bundleId" TEXT NOT NULL,
    "variant" TEXT,
    "costPrice" REAL NOT NULL,
    "markedPrice" REAL NOT NULL,
    "listedPrice" REAL NOT NULL,
    "targetPrice" REAL NOT NULL,
    "floorPrice" REAL NOT NULL,
    "maxDiscountPercent" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_stock',
    CONSTRAINT "inventory_items_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "bundles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "saleDate" DATETIME NOT NULL,
    "sellingPrice" REAL NOT NULL,
    "profit" REAL NOT NULL,
    CONSTRAINT "sales_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "loss_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bundleId" TEXT NOT NULL,
    "lossType" TEXT NOT NULL,
    "itemsLost" INTEGER NOT NULL,
    "lossValue" REAL NOT NULL,
    "lossDate" DATETIME NOT NULL,
    "recoveryStatus" TEXT NOT NULL DEFAULT 'none',
    "recoveryValue" REAL,
    "recoveryDate" DATETIME,
    CONSTRAINT "loss_entries_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "bundles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

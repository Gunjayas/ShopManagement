// shared/types.ts
//
// Hand-maintained types mirroring server/prisma/schema.prisma.
// If you change the schema, update this file too — nothing enforces
// that automatically, so treat schema changes and this file as one commit.

// ─── Enums ───────────────────────────────────────────────

export type OrderStatus = 'ongoing' | 'closed';

export type BundleStatus =
  | 'pending'
  | 'arrived'
  | 'lost'
  | 'refunded'
  | 'replaced';

export type ItemStatus = 'in_stock' | 'sold' | 'damaged' | 'returned';

export type LossType = 'full_bundle' | 'partial';

export type RecoveryStatus = 'none' | 'pending_claim' | 'refunded' | 'replaced';

// ─── Entities ────────────────────────────────────────────

export interface Order {
  id: string;
  supplierOrCountry: string;
  orderDate: string; // ISO date string over the wire — see note below
  transportationFee: number;
  expectedBundleCount: number;
  status: OrderStatus;
}

export interface Bundle {
  id: string;
  orderId: string;
  type: string;
  designName: string;
  itemsOrdered: number;
  costPerItem: number;
  status: BundleStatus;
  itemsReceived: number | null;
  arrivalDate: string | null;
}

export interface InventoryItem {
  id: string;
  bundleId: string;
  variant: string | null;
  costPrice: number;
  markedPrice: number;
  listedPrice: number;
  targetPrice: number;
  floorPrice: number;
  maxDiscountPercent: number;
  status: ItemStatus;
}

export interface Sale {
  id: string;
  itemId: string;
  saleDate: string;
  sellingPrice: number;
  profit: number;
}

export interface LossEntry {
  id: string;
  bundleId: string;
  lossType: LossType;
  itemsLost: number;
  lossValue: number;
  lossDate: string;
  recoveryStatus: RecoveryStatus;
  recoveryValue: number | null;
  recoveryDate: string | null;
}
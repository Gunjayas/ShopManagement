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

// Give sale screens the item and bundle identity needed to explain each stored profit.
export interface SaleWithItem extends Sale {
  item: InventoryItem & { bundle: Bundle };
}

// Give loss screens the original bundle and supplier context without a second request.
export interface LossEntryWithBundle extends LossEntry {
  bundle: Bundle & { order: Order };
}

// Describe the only values the server accepts when recording one completed sale.
export interface CreateSaleInput {
  item_id: string;
  sale_date: string;
  selling_price: number;
}

// Describe a replacement purchasing unit created as a distinct pending bundle.
export interface ReplacementBundleInput {
  type: string;
  design_name: string;
  items_ordered: number;
  cost_per_item: number;
}

// Describe additive recovery details while keeping immutable loss history out of the request.
export interface RecoverLossInput {
  recovery_status: 'refunded' | 'replaced';
  recovery_value: number;
  recovery_date: string;
  new_bundle?: ReplacementBundleInput;
}

// Keep report responses consistent between the API and the mobile report screens.
export interface MonthlyPlReport {
  total_item_profit: number;
  total_transit_losses: number;
  total_recoveries: number;
  transportation_fees: number;
  true_monthly_profit: number;
}

// Describe one in-stock unit that has remained unsold beyond the selected threshold.
export interface DeadStockReportItem {
  item_id: string;
  variant: string | null;
  type: string;
  design_name: string;
  cost_price: number;
  listed_price: number;
  days_in_stock: number;
}

// Describe the database-aggregated sales speed for one type and design.
export interface MoverReportItem {
  type: string;
  design_name: string;
  units_sold: number;
  avg_days_to_sale: number | null;
}

// Describe a loss record with the bundle and recovery values needed for reporting.
export interface TransitLossReportItem {
  loss_id: string;
  type: string;
  design_name: string;
  supplier_or_country: string;
  loss_date: string;
  loss_type: LossType;
  loss_value: number;
  recovery_status: RecoveryStatus;
  recovery_value: number;
  net_loss: number;
}

// Return both the transit-loss detail rows and their database-calculated totals.
export interface TransitLossReport {
  entries: TransitLossReportItem[];
  total_loss_value: number;
  total_recovery_value: number;
  total_net_loss: number;
}

// Summarize price leakage against the listed price for sales in one month.
export interface DiscountLeakageReport {
  total_leakage: number;
  sale_count: number;
  avg_discount_per_sale: number;
}

// Describe all historical profitability values for one bundle.
export interface BundleProfitabilityReportItem {
  bundle_id: string;
  type: string;
  design_name: string;
  status: BundleStatus;
  supplier_or_country: string;
  items_ordered: number;
  items_received: number;
  total_profit: number;
  total_loss: number;
  net: number;
  units_sold: number;
}
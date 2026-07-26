import type { Bundle, BundleProfitabilityReportItem, DeadStockReportItem, DiscountLeakageReport, InventoryItem, LossEntry, LossEntryWithBundle, MonthlyPlReport, MoverReportItem, Order, RecoverLossInput, Sale, SaleWithItem, TransitLossReport } from '@shared/types';

interface ApiErrorBody { message?: string; error?: string }

// Turn failed HTTP responses into the plain-English message the owner should see.
const requestJson = async <ResponseBody>(path: string, options?: RequestInit): Promise<ResponseBody> => {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  const responseBody = await response.json() as ResponseBody | ApiErrorBody;
  if (!response.ok) {
    const errorBody = responseBody as ApiErrorBody;
    throw new Error(errorBody.message ?? 'The request could not be completed.');
  }
  return responseBody as ResponseBody;
};

// Fetch the newest orders for the order list workspace.
export const fetchOrders = async (): Promise<Order[]> => requestJson<Order[]>('/api/orders');

// Fetch one order header for its detail workspace.
export const fetchOrder = async (orderId: string): Promise<Order> => requestJson<Order>(`/api/orders/${orderId}`);

// Create a new ongoing order from the owner-entered purchasing details.
export const postOrder = async (orderValues: unknown): Promise<Order> => requestJson<Order>('/api/orders', { method: 'POST', body: JSON.stringify(orderValues) });

// Save editable order fields without sending a status change.
export const patchOrder = async (orderId: string, orderValues: unknown): Promise<Order> => requestJson<Order>(`/api/orders/${orderId}`, { method: 'PATCH', body: JSON.stringify(orderValues) });

// Close an order through its intentionally validation-free status action.
export const closeOrder = async (orderId: string): Promise<Order> => requestJson<Order>(`/api/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'closed' }) });

// Fetch all bundles belonging to an order detail page.
export const fetchBundles = async (orderId: string): Promise<Bundle[]> => requestJson<Bundle[]>(`/api/orders/${orderId}/bundles`);

// Create a pending bundle under its order.
export const postBundle = async (orderId: string, bundleValues: unknown): Promise<Bundle> => requestJson<Bundle>(`/api/orders/${orderId}/bundles`, { method: 'POST', body: JSON.stringify(bundleValues) });

// Edit the three bundle fields allowed while the bundle is pending.
export const patchBundle = async (bundleId: string, bundleValues: unknown): Promise<Bundle> => requestJson<Bundle>(`/api/bundles/${bundleId}`, { method: 'PATCH', body: JSON.stringify(bundleValues) });

// Mark a bundle arrived and let the server generate inventory and loss history atomically.
export const arriveBundle = async (bundleId: string, arrivalValues: unknown): Promise<Bundle> => requestJson<Bundle>(`/api/bundles/${bundleId}/arrive`, { method: 'PATCH', body: JSON.stringify(arrivalValues) });

// Mark a pending bundle fully lost and let the server create its loss history atomically.
export const loseBundle = async (bundleId: string): Promise<Bundle> => requestJson<Bundle>(`/api/bundles/${bundleId}/lost`, { method: 'PATCH', body: JSON.stringify({}) });

// Fetch priced and unpriced individual stock units with bundle context.
export const fetchInventory = async (status: string): Promise<Array<InventoryItem & { bundle: Bundle }>> => {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return requestJson<Array<InventoryItem & { bundle: Bundle }>>(`/api/inventory${query}`);
};

// Save only the five editable price controls for an inventory item.
export const patchPricing = async (itemId: string, pricingValues: unknown): Promise<InventoryItem> => requestJson<InventoryItem>(`/api/inventory/${itemId}/pricing`, { method: 'PATCH', body: JSON.stringify(pricingValues) });

// Record one sale through the server's floor-price guard and immutable profit calculation.
export const postSale = async (saleValues: unknown): Promise<Sale> => requestJson<Sale>('/api/sales', { method: 'POST', body: JSON.stringify(saleValues) });

// Fetch newest sales with item, bundle, design, and variant context for the sales ledger.
export const fetchSales = async (): Promise<SaleWithItem[]> => requestJson<SaleWithItem[]>('/api/sales');

// Mark an available item as damaged with the server's one-way lifecycle rule.
export const markInventoryDamaged = async (itemId: string): Promise<InventoryItem> => requestJson<InventoryItem>(`/api/inventory/${itemId}/damage`, { method: 'PATCH', body: JSON.stringify({}) });

// Process a return by hard-deleting the sale and restoring the item to stock atomically.
export const returnInventoryItem = async (itemId: string): Promise<InventoryItem> => requestJson<InventoryItem>(`/api/inventory/${itemId}/return`, { method: 'PATCH', body: JSON.stringify({}) });

// Fetch newest transit-loss records with original bundle and supplier context.
export const fetchLossEntries = async (): Promise<LossEntryWithBundle[]> => requestJson<LossEntryWithBundle[]>('/api/loss-entries');

// Save only additive recovery fields and any distinct replacement bundle details.
export const recoverLossEntry = async (lossEntryId: string, recoveryValues: RecoverLossInput): Promise<LossEntry> => requestJson<LossEntry>(`/api/loss-entries/${lossEntryId}/recover`, { method: 'PATCH', body: JSON.stringify(recoveryValues) });

// Fetch the month's profit, losses, recoveries, and transportation fees with correct date attribution.
export const fetchMonthlyPl = async (month: string): Promise<MonthlyPlReport> => requestJson<MonthlyPlReport>(`/api/reports/monthly-pl?month=${encodeURIComponent(month)}`);

// Fetch in-stock units older than the selected bundle-arrival age threshold.
export const fetchDeadStock = async (days: number): Promise<DeadStockReportItem[]> => requestJson<DeadStockReportItem[]>(`/api/reports/dead-stock?days=${days}`);

// Fetch type-and-design mover groups already aggregated by the database.
export const fetchMovers = async (): Promise<MoverReportItem[]> => requestJson<MoverReportItem[]>('/api/reports/movers');

// Fetch transit losses and their recovery-adjusted summary for all time or one loss month.
export const fetchTransitLosses = async (month?: string): Promise<TransitLossReport> => requestJson<TransitLossReport>(`/api/reports/transit-losses${month ? `?month=${encodeURIComponent(month)}` : ''}`);

// Fetch listed-price discount leakage for the selected sales month.
export const fetchDiscountLeakage = async (month: string): Promise<DiscountLeakageReport> => requestJson<DiscountLeakageReport>(`/api/reports/discount-leakage?month=${encodeURIComponent(month)}`);

// Fetch every bundle's historical profit, loss, and net result without status filtering.
export const fetchBundleProfitability = async (): Promise<BundleProfitabilityReportItem[]> => requestJson<BundleProfitabilityReportItem[]>('/api/reports/bundle-profitability');
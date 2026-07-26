import type { Bundle, InventoryItem, Order } from '@shared/types';

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
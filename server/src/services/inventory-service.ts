import type { InventoryItem, ItemStatus, Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/app-error.js';
import { requireNonNegativeNumber, requireRecord } from '../lib/validation.js';

const itemStatuses: ItemStatus[] = ['in_stock', 'sold', 'damaged', 'returned'];
type InventoryWithBundle = Prisma.InventoryItemGetPayload<{ include: { bundle: true } }>;

// Validate an optional stock-state filter so list results have predictable meaning.
const readStatusFilter = (status: unknown): ItemStatus | undefined => {
  if (status === undefined || status === '') return undefined;
  if (typeof status !== 'string' || !itemStatuses.includes(status as ItemStatus)) {
    throw new AppError(400, 'invalid_request', 'status must be in_stock, sold, damaged, or returned.');
  }
  return status as ItemStatus;
};

// List individual selling units with their bundle identity for practical pricing work.
export const listInventory = async (status: unknown): Promise<InventoryWithBundle[]> => {
  const statusFilter = readStatusFilter(status);
  return prisma.inventoryItem.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    include: { bundle: true },
    orderBy: { id: 'asc' },
  });
};

// Set the owner's five pricing controls while preserving the item's fixed acquisition cost.
export const updateInventoryPricing = async (itemId: string, body: unknown): Promise<InventoryItem> => {
  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) throw new AppError(404, 'not_found', 'The requested inventory item could not be found.');
  const pricingInput = requireRecord(body);
  // business rule: cost_price is read-only after creation and is intentionally ignored if sent.
  return prisma.inventoryItem.update({
    where: { id: itemId },
    data: {
      markedPrice: requireNonNegativeNumber(pricingInput, 'marked_price'),
      listedPrice: requireNonNegativeNumber(pricingInput, 'listed_price'),
      targetPrice: requireNonNegativeNumber(pricingInput, 'target_price'),
      floorPrice: requireNonNegativeNumber(pricingInput, 'floor_price'),
      maxDiscountPercent: requireNonNegativeNumber(pricingInput, 'max_discount_percent'),
    },
  });
};
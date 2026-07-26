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

// Remove an unsellable physical item from available stock with no reversal path.
export const damageInventoryItem = async (itemId: string): Promise<InventoryItem> => {
  const itemToDamage = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!itemToDamage) throw new AppError(404, 'not_found', 'The inventory item to mark as damaged could not be found.');
  // business rule: damage is terminal and is allowed only from in_stock.
  if (itemToDamage.status !== 'in_stock') {
    throw new AppError(422, 'business_rule_violation', 'Only an in-stock item can be marked as damaged.', 'ITEM_NOT_IN_STOCK');
  }
  return prisma.inventoryItem.update({ where: { id: itemId }, data: { status: 'damaged' } });
};

// Reverse a completed sale by deleting its history and restoring only the item's stock status.
export const returnInventoryItem = async (itemId: string): Promise<InventoryItem> => {
  return prisma.$transaction(async (transaction): Promise<InventoryItem> => {
    const itemToReturn = await transaction.inventoryItem.findUnique({ where: { id: itemId } });
    if (!itemToReturn) throw new AppError(404, 'not_found', 'The sold inventory item to return could not be found.');
    // business rule: return is allowed only from sold and immediately restores in_stock.
    if (itemToReturn.status !== 'sold') {
      throw new AppError(422, 'business_rule_violation', 'Only a sold item can be processed as a return.', 'ITEM_NOT_SOLD');
    }
    const latestSale = await transaction.sale.findFirst({ where: { itemId }, orderBy: { saleDate: 'desc' } });
    if (!latestSale) {
      throw new AppError(422, 'business_rule_violation', 'This sold item has no sale record to return.', 'SALE_NOT_FOUND_FOR_ITEM');
    }
    // business rule: a return hard-deletes the sale instead of retaining a voided sale row.
    await transaction.sale.delete({ where: { id: latestSale.id } });
    // business rule: all fixed and owner-set pricing fields remain untouched during a return.
    return transaction.inventoryItem.update({ where: { id: itemId }, data: { status: 'in_stock' } });
  });
};
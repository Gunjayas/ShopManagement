import type { Prisma, Sale } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/app-error.js';
import { requireDate, requireNonNegativeNumber, requireRecord, requireText } from '../lib/validation.js';

type SaleWithItem = Prisma.SaleGetPayload<{ include: { item: { include: { bundle: true } } } }>;

// Record a completed sale while preserving the exact item cost and profit known on that date.
export const createSale = async (body: unknown): Promise<Sale> => {
  const saleInput = requireRecord(body);
  const itemId = requireText(saleInput, 'item_id');
  const saleDate = requireDate(saleInput, 'sale_date');
  const sellingPrice = requireNonNegativeNumber(saleInput, 'selling_price');
  const itemForSale = await prisma.inventoryItem.findUnique({ where: { id: itemId } });

  if (!itemForSale) throw new AppError(404, 'not_found', 'The inventory item selected for this sale could not be found.');
  if (itemForSale.status !== 'in_stock') {
    throw new AppError(422, 'business_rule_violation', 'Only an in-stock item can be sold.', 'ITEM_NOT_IN_STOCK');
  }
  // business rule: the floor price is a hard server-side block checked before opening a transaction.
  if (sellingPrice < itemForSale.floorPrice) {
    throw new AppError(422, 'business_rule_violation', `The selling price cannot be below the floor price of ${itemForSale.floorPrice.toFixed(2)}.`, 'SELLING_PRICE_BELOW_FLOOR');
  }

  // business rule: profit is stored once from the fixed item cost and is never recalculated later.
  const saleProfit = sellingPrice - itemForSale.costPrice;
  return prisma.$transaction(async (transaction): Promise<Sale> => {
    await transaction.inventoryItem.update({ where: { id: itemId }, data: { status: 'sold' } });
    return transaction.sale.create({ data: { itemId, saleDate, sellingPrice, profit: saleProfit } });
  });
};

// List completed sales with enough item context for the owner to audit historical profit.
export const listSales = async (): Promise<SaleWithItem[]> => {
  return prisma.sale.findMany({
    include: { item: { include: { bundle: true } } },
    orderBy: { saleDate: 'desc' },
  });
};
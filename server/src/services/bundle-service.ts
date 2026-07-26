import type { Bundle } from '../../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/app-error.js';
import { requireDate, requireNonNegativeInteger, requireNonNegativeNumber, requireRecord, requireText } from '../lib/validation.js';

interface BundleValues { type: string; designName: string; costPerItem: number }

// Find a bundle before applying lifecycle rules or displaying it under an order.
const requireBundle = async (bundleId: string): Promise<Bundle> => {
  const bundle = await prisma.bundle.findUnique({ where: { id: bundleId } });
  if (!bundle) throw new AppError(404, 'not_found', 'The requested bundle could not be found.');
  return bundle;
};

// Read the bundle fields that remain editable only until stock is generated or lost.
const readEditableBundleValues = (body: unknown): BundleValues => {
  const bundleInput = requireRecord(body);
  return {
    type: requireText(bundleInput, 'type'),
    designName: requireText(bundleInput, 'design_name'),
    costPerItem: requireNonNegativeNumber(bundleInput, 'cost_per_item'),
  };
};

// Add a pending purchasing unit beneath an existing order.
export const createBundle = async (orderId: string, body: unknown): Promise<Bundle> => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError(404, 'not_found', 'The order for this bundle could not be found.');
  const bundleInput = requireRecord(body);
  return prisma.bundle.create({
    data: {
      orderId,
      ...readEditableBundleValues(bundleInput),
      itemsOrdered: requireNonNegativeInteger(bundleInput, 'items_ordered'),
    },
  });
};

// Show every purchasing unit attached to the selected order.
export const listBundles = async (orderId: string): Promise<Bundle[]> => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError(404, 'not_found', 'The requested order could not be found.');
  return prisma.bundle.findMany({ where: { orderId }, orderBy: { id: 'asc' } });
};

// Correct pending bundle details without changing the fixed ordered quantity.
export const updateBundle = async (bundleId: string, body: unknown): Promise<Bundle> => {
  const bundle = await requireBundle(bundleId);
  if (bundle.status !== 'pending') {
    throw new AppError(422, 'business_rule_violation', 'Only pending bundles can be edited.', 'BUNDLE_NOT_PENDING');
  }
  // business rule: items_ordered is stripped even if sent because it is fixed at creation.
  return prisma.bundle.update({ where: { id: bundleId }, data: readEditableBundleValues(body) });
};

// Receive stock atomically so bundle state, sellable items, and partial loss history cannot diverge.
export const arriveBundle = async (bundleId: string, body: unknown): Promise<Bundle> => {
  const arrivalInput = requireRecord(body);
  const itemsReceived = requireNonNegativeInteger(arrivalInput, 'items_received');
  const arrivalDate = requireDate(arrivalInput, 'arrival_date');
  const variantValue = arrivalInput.variant;
  if (variantValue !== undefined && typeof variantValue !== 'string') {
    throw new AppError(400, 'invalid_request', 'variant must be a text value when provided.');
  }
  const variant = typeof variantValue === 'string' && variantValue.trim() !== '' ? variantValue.trim() : null;

  return prisma.$transaction(async (transaction): Promise<Bundle> => {
    const bundle = await transaction.bundle.findUnique({ where: { id: bundleId } });
    if (!bundle) throw new AppError(404, 'not_found', 'The requested bundle could not be found.');
    if (bundle.status !== 'pending') {
      throw new AppError(422, 'business_rule_violation', 'Only a pending bundle can be marked as arrived.', 'BUNDLE_NOT_PENDING');
    }
    if (itemsReceived > bundle.itemsOrdered) {
      throw new AppError(422, 'business_rule_violation', 'Items received cannot exceed items ordered.', 'RECEIVED_EXCEEDS_ORDERED');
    }
    const arrivedBundle = await transaction.bundle.update({
      where: { id: bundleId },
      data: { status: 'arrived', itemsReceived, arrivalDate },
    });
    if (itemsReceived > 0) {
      // business rule: cost_price is a direct copy and is never recalculated after creation.
      await transaction.inventoryItem.createMany({
        data: Array.from({ length: itemsReceived }, () => ({
          bundleId,
          variant,
          costPrice: bundle.costPerItem,
          markedPrice: 0,
          listedPrice: 0,
          targetPrice: 0,
          floorPrice: 0,
          maxDiscountPercent: 0,
        })),
      });
    }
    const itemsLost = bundle.itemsOrdered - itemsReceived;
    if (itemsLost > 0) {
      await transaction.lossEntry.create({
        data: { bundleId, lossType: 'partial', itemsLost, lossValue: itemsLost * bundle.costPerItem, lossDate: arrivalDate },
      });
    }
    return arrivedBundle;
  });
};

// Record a fully lost shipment atomically without creating inventory that never arrived.
export const loseBundle = async (bundleId: string): Promise<Bundle> => {
  return prisma.$transaction(async (transaction): Promise<Bundle> => {
    const bundle = await transaction.bundle.findUnique({ where: { id: bundleId } });
    if (!bundle) throw new AppError(404, 'not_found', 'The requested bundle could not be found.');
    if (bundle.status !== 'pending') {
      throw new AppError(422, 'business_rule_violation', 'Only a pending bundle can be marked as lost.', 'BUNDLE_NOT_PENDING');
    }
    const lostBundle = await transaction.bundle.update({
      where: { id: bundleId },
      data: { status: 'lost', itemsReceived: 0 },
    });
    await transaction.lossEntry.create({
      data: {
        bundleId,
        lossType: 'full_bundle',
        itemsLost: bundle.itemsOrdered,
        lossValue: bundle.itemsOrdered * bundle.costPerItem,
        lossDate: new Date(),
      },
    });
    return lostBundle;
  });
};
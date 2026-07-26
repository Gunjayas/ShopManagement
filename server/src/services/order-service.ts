import type { Order } from '../../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/app-error.js';
import { requireDate, requireNonNegativeInteger, requireNonNegativeNumber, requireRecord, requireText } from '../lib/validation.js';

interface OrderValues {
  supplierOrCountry: string;
  orderDate: Date;
  transportationFee: number;
  expectedBundleCount: number;
}

// Validate the editable order fields so purchasing records remain complete and reportable.
const readOrderValues = (body: unknown): OrderValues => {
  const orderInput = requireRecord(body);
  return {
    supplierOrCountry: requireText(orderInput, 'supplier_or_country'),
    orderDate: requireDate(orderInput, 'order_date'),
    transportationFee: requireNonNegativeNumber(orderInput, 'transportation_fee'),
    expectedBundleCount: requireNonNegativeInteger(orderInput, 'expected_bundle_count'),
  };
};

// Create an ongoing order as the purchasing record that future bundles belong to.
export const createOrder = async (body: unknown): Promise<Order> => prisma.order.create({ data: readOrderValues(body) });

// List newest purchases first so active shipments are easiest for the owner to find.
export const listOrders = async (): Promise<Order[]> => prisma.order.findMany({ orderBy: { orderDate: 'desc' } });

// Retrieve one purchasing record before presenting its details and bundles.
export const getOrder = async (orderId: string): Promise<Order> => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError(404, 'not_found', 'The requested order could not be found.');
  return order;
};

// Correct order details at any time without changing its independent lifecycle status.
export const updateOrder = async (orderId: string, body: unknown): Promise<Order> => {
  await getOrder(orderId);
  // business rule: status is intentionally excluded because only the close endpoint controls it.
  return prisma.order.update({ where: { id: orderId }, data: readOrderValues(body) });
};

// Close any order on owner request without imposing bundle-state validation.
export const closeOrder = async (orderId: string): Promise<Order> => {
  await getOrder(orderId);
  // business rule: closing is a plain status flip regardless of bundle progress.
  return prisma.order.update({ where: { id: orderId }, data: { status: 'closed' } });
};
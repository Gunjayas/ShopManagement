import type { BundleProfitabilityReportItem } from '../../../../shared/types.js';
import { prisma } from '../../lib/prisma.js';

type BundleProfitabilityQueryRow = {
  bundleId: string;
  type: string;
  designName: string;
  status: BundleProfitabilityReportItem['status'];
  supplierOrCountry: string;
  itemsOrdered: number;
  itemsReceived: number | null;
  totalProfit: number | null;
  totalLoss: number | null;
  unitsSold: number | bigint;
};

/**
 * Sums: Sale.profit and LossEntry.lossValue per Bundle; also counts sold InventoryItem.id.
 * Date filter: none; this is an all-time report.
 * Joins: Bundle → Order, Bundle → InventoryItem → Sale, and Bundle → LossEntry; no Bundle.status filter.
 */
// Compare every bundle's stored sale profit with its immutable loss-entry history.
export const getBundleProfitability = async (): Promise<BundleProfitabilityReportItem[]> => {
  // business rule: include every bundle status and aggregate total loss only from stored LossEntry.lossValue rows.
  const bundleRows = await prisma.$queryRaw<BundleProfitabilityQueryRow[]>`
    SELECT b.id AS bundleId,
           b.type AS type,
           b.designName AS designName,
           b.status AS status,
           o.supplierOrCountry AS supplierOrCountry,
           b.itemsOrdered AS itemsOrdered,
           b.itemsReceived AS itemsReceived,
           COALESCE(profits.totalProfit, 0) AS totalProfit,
           COALESCE(losses.totalLoss, 0) AS totalLoss,
           COALESCE(sold.unitsSold, 0) AS unitsSold
    FROM bundles b
    INNER JOIN orders o ON o.id = b.orderId
    LEFT JOIN (
      SELECT i.bundleId AS bundleId, SUM(s.profit) AS totalProfit
      FROM inventory_items i
      INNER JOIN sales s ON s.itemId = i.id
      GROUP BY i.bundleId
    ) profits ON profits.bundleId = b.id
    LEFT JOIN (
      SELECT bundleId, SUM(lossValue) AS totalLoss
      FROM loss_entries
      GROUP BY bundleId
    ) losses ON losses.bundleId = b.id
    LEFT JOIN (
      SELECT bundleId, COUNT(id) AS unitsSold
      FROM inventory_items
      WHERE status = 'sold'
      GROUP BY bundleId
    ) sold ON sold.bundleId = b.id
    ORDER BY (COALESCE(profits.totalProfit, 0) - COALESCE(losses.totalLoss, 0)) DESC
  `;
  return bundleRows.map((bundleRow): BundleProfitabilityReportItem => ({
    bundle_id: bundleRow.bundleId,
    type: bundleRow.type,
    design_name: bundleRow.designName,
    status: bundleRow.status,
    supplier_or_country: bundleRow.supplierOrCountry,
    items_ordered: bundleRow.itemsOrdered,
    items_received: bundleRow.itemsReceived ?? 0,
    total_profit: bundleRow.totalProfit ?? 0,
    total_loss: bundleRow.totalLoss ?? 0,
    net: (bundleRow.totalProfit ?? 0) - (bundleRow.totalLoss ?? 0),
    units_sold: Number(bundleRow.unitsSold),
  }));
};
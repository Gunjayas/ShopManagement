import type { DiscountLeakageReport } from '../../../../shared/types.js';
import { prisma } from '../../lib/prisma.js';
import { requireMonthRange } from '../report-date.js';

type DiscountLeakageQueryRow = { totalLeakage: number | null; saleCount: number | bigint; avgDiscountPerSale: number | null };

/**
 * Sums: InventoryItem.listedPrice minus Sale.sellingPrice; also counts Sale.id and averages the same difference.
 * Date filter: Sale.saleDate.
 * Join: Sale → InventoryItem for listedPrice; markedPrice and targetPrice are intentionally not used.
 */
// Measure monthly sales value given up against the customer-facing listed price.
export const getDiscountLeakage = async (month: unknown): Promise<DiscountLeakageReport> => {
  const monthRange = requireMonthRange(month);
  const [summary] = await prisma.$queryRaw<DiscountLeakageQueryRow[]>`
    SELECT COALESCE(SUM(i.listedPrice - s.sellingPrice), 0) AS totalLeakage,
           COUNT(s.id) AS saleCount,
           COALESCE(AVG(i.listedPrice - s.sellingPrice), 0) AS avgDiscountPerSale
    FROM sales s
    INNER JOIN inventory_items i ON i.id = s.itemId
    WHERE s.saleDate >= ${monthRange.start} AND s.saleDate < ${monthRange.end}
  `;
  return {
    total_leakage: summary?.totalLeakage ?? 0,
    sale_count: Number(summary?.saleCount ?? 0),
    avg_discount_per_sale: summary?.avgDiscountPerSale ?? 0,
  };
};
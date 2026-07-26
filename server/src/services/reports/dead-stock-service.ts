import type { DeadStockReportItem } from '../../../../shared/types.js';
import { prisma } from '../../lib/prisma.js';
import { requireDays } from '../report-date.js';

type DeadStockQueryRow = Omit<DeadStockReportItem, 'days_in_stock'> & { days_in_stock: number | bigint };

/**
 * Sums: none.
 * Date filter: Bundle.arrivalDate compared with today minus the requested number of days.
 * Join: InventoryItem → Bundle.
 */
// Return in-stock units whose bundle arrival date makes them older than the selected age threshold.
export const getDeadStock = async (days: unknown): Promise<DeadStockReportItem[]> => {
  const ageLimit = requireDays(days);
  // business rule: stock age comes only from Bundle.arrivalDate, never an item-level date.
  const staleItems = await prisma.$queryRaw<DeadStockQueryRow[]>`
    SELECT i.id AS item_id,
           i.variant AS variant,
           b.type AS type,
           b.designName AS design_name,
           i.costPrice AS cost_price,
           i.listedPrice AS listed_price,
           CAST(julianday('now') - julianday(b.arrivalDate) AS INTEGER) AS days_in_stock
    FROM inventory_items i
    INNER JOIN bundles b ON b.id = i.bundleId
    WHERE i.status = 'in_stock'
      AND b.arrivalDate IS NOT NULL
      AND (julianday('now') - julianday(b.arrivalDate)) > ${ageLimit}
    ORDER BY days_in_stock DESC
  `;
  return staleItems.map((item): DeadStockReportItem => ({ ...item, days_in_stock: Number(item.days_in_stock) }));
};
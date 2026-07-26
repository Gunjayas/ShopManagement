import type { MoverReportItem } from '../../../../shared/types.js';
import { prisma } from '../../lib/prisma.js';

type MoverQueryRow = { type: string; designName: string; unitsSold: number | bigint; avgDaysToSale: number | null };

/**
 * Sums: none; counts InventoryItem.id and averages Sale.saleDate minus Bundle.arrivalDate.
 * Date fields: Sale.saleDate and Bundle.arrivalDate, with no calendar-range filter.
 * Joins: InventoryItem → Sale and InventoryItem → Bundle; grouped by Bundle.type + Bundle.designName.
 */
// Compare type-and-design groups by database-aggregated time from bundle arrival to sale.
export const getMovers = async (): Promise<MoverReportItem[]> => {
  // business rule: sale speed starts at the sold item's own Bundle.arrivalDate.
  const moverRows = await prisma.$queryRaw<MoverQueryRow[]>`
    SELECT b.type AS type,
           b.designName AS designName,
           COUNT(i.id) AS unitsSold,
           AVG(CASE WHEN b.arrivalDate IS NOT NULL THEN julianday(s.saleDate) - julianday(b.arrivalDate) ELSE NULL END) AS avgDaysToSale
    FROM inventory_items i
    INNER JOIN bundles b ON b.id = i.bundleId
    LEFT JOIN sales s ON s.itemId = i.id
    WHERE i.status = 'sold'
    GROUP BY b.type, b.designName
    ORDER BY avgDaysToSale ASC
  `;
  return moverRows.map((row): MoverReportItem => ({
    type: row.type,
    design_name: row.designName,
    units_sold: Number(row.unitsSold),
    avg_days_to_sale: row.avgDaysToSale,
  }));
};
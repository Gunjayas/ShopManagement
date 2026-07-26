import type { MonthlyPlReport } from '../../../../shared/types.js';
import { prisma } from '../../lib/prisma.js';
import { requireMonthRange } from '../report-date.js';

/**
 * Sums: Sale.profit, LossEntry.lossValue, LossEntry.recoveryValue, Order.transportationFee.
 * Date filters: Sale.saleDate, LossEntry.lossDate, LossEntry.recoveryDate, Order.orderDate respectively.
 * Joins: none.
 */
// Calculate true monthly profit from events attributed to the dates when they actually happened.
export const getMonthlyPl = async (month: unknown): Promise<MonthlyPlReport> => {
  const monthRange = requireMonthRange(month);
  // business rule: each P&L event is filtered by its own event date and never its parent record's date.
  const [saleTotals, lossTotals, recoveryTotals, orderTotals] = await Promise.all([
    prisma.sale.aggregate({ where: { saleDate: { gte: monthRange.start, lt: monthRange.end } }, _sum: { profit: true } }),
    prisma.lossEntry.aggregate({ where: { lossDate: { gte: monthRange.start, lt: monthRange.end } }, _sum: { lossValue: true } }),
    prisma.lossEntry.aggregate({ where: { recoveryDate: { gte: monthRange.start, lt: monthRange.end }, recoveryStatus: { in: ['refunded', 'replaced'] } }, _sum: { recoveryValue: true } }),
    prisma.order.aggregate({ where: { orderDate: { gte: monthRange.start, lt: monthRange.end } }, _sum: { transportationFee: true } }),
  ]);
  const totalItemProfit = saleTotals._sum.profit ?? 0;
  const totalTransitLosses = lossTotals._sum.lossValue ?? 0;
  const totalRecoveries = recoveryTotals._sum.recoveryValue ?? 0;
  const transportationFees = orderTotals._sum.transportationFee ?? 0;
  return {
    total_item_profit: totalItemProfit,
    total_transit_losses: totalTransitLosses,
    total_recoveries: totalRecoveries,
    transportation_fees: transportationFees,
    true_monthly_profit: totalItemProfit - transportationFees - totalTransitLosses + totalRecoveries,
  };
};
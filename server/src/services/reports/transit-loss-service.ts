import type { TransitLossReport, TransitLossReportItem } from '../../../../shared/types.js';
import { prisma } from '../../lib/prisma.js';
import { optionalMonthRange } from '../report-date.js';

type TransitLossQueryRow = Omit<TransitLossReportItem, 'loss_date' | 'recovery_value' | 'net_loss'> & {
  loss_date: Date;
  recovery_value: number | null;
  net_loss: number;
};

/**
 * Sums: LossEntry.lossValue and LossEntry.recoveryValue.
 * Date filter: LossEntry.lossDate when a month is supplied; recoveryDate is intentionally not used.
 * Joins: LossEntry → Bundle → Order for bundle identity and supplier context.
 */
// Summarize historical loss and recovery values using the month when each loss was recorded.
export const getTransitLosses = async (month: unknown): Promise<TransitLossReport> => {
  const monthRange = optionalMonthRange(month);
  // business rule: the optional report month applies to lossDate, never recoveryDate.
  const lossEntries = monthRange
    ? await prisma.$queryRaw<TransitLossQueryRow[]>`
        SELECT l.id AS loss_id,
               b.type AS type,
               b.designName AS design_name,
               o.supplierOrCountry AS supplier_or_country,
               l.lossDate AS loss_date,
               l.lossType AS loss_type,
               l.lossValue AS loss_value,
               l.recoveryStatus AS recovery_status,
               COALESCE(l.recoveryValue, 0) AS recovery_value,
               l.lossValue - COALESCE(l.recoveryValue, 0) AS net_loss
        FROM loss_entries l
        INNER JOIN bundles b ON b.id = l.bundleId
        INNER JOIN orders o ON o.id = b.orderId
        WHERE l.lossDate >= ${monthRange.start} AND l.lossDate < ${monthRange.end}
        ORDER BY l.lossDate DESC
      `
    : await prisma.$queryRaw<TransitLossQueryRow[]>`
        SELECT l.id AS loss_id,
               b.type AS type,
               b.designName AS design_name,
               o.supplierOrCountry AS supplier_or_country,
               l.lossDate AS loss_date,
               l.lossType AS loss_type,
               l.lossValue AS loss_value,
               l.recoveryStatus AS recovery_status,
               COALESCE(l.recoveryValue, 0) AS recovery_value,
               l.lossValue - COALESCE(l.recoveryValue, 0) AS net_loss
        FROM loss_entries l
        INNER JOIN bundles b ON b.id = l.bundleId
        INNER JOIN orders o ON o.id = b.orderId
        ORDER BY l.lossDate DESC
      `;
  const summary = await prisma.lossEntry.aggregate({
    where: monthRange ? { lossDate: { gte: monthRange.start, lt: monthRange.end } } : undefined,
    _sum: { lossValue: true, recoveryValue: true },
  });
  const entries = lossEntries.map((lossEntry): TransitLossReportItem => {
    return {
      ...lossEntry,
      loss_date: lossEntry.loss_date.toISOString(),
      recovery_value: lossEntry.recovery_value ?? 0,
    };
  });
  const totalLossValue = summary._sum.lossValue ?? 0;
  const totalRecoveryValue = summary._sum.recoveryValue ?? 0;
  return { entries, total_loss_value: totalLossValue, total_recovery_value: totalRecoveryValue, total_net_loss: totalLossValue - totalRecoveryValue };
};
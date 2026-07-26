import type { Bundle, LossEntry, Prisma, RecoveryStatus } from '../../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/app-error.js';
import { requireDate, requireNonNegativeInteger, requireNonNegativeNumber, requireRecord, requireText } from '../lib/validation.js';

type LossEntryWithBundle = Prisma.LossEntryGetPayload<{ include: { bundle: { include: { order: true } } } }>;
interface RecoveryValues { recoveryStatus: 'refunded' | 'replaced'; recoveryValue: number; recoveryDate: Date }
interface ReplacementValues { type: string; designName: string; itemsOrdered: number; costPerItem: number }

// Accept only final recovery outcomes because pending claims are managed outside this application.
const readRecoveryValues = (recoveryInput: Record<string, unknown>): RecoveryValues => {
  const recoveryStatus = recoveryInput.recovery_status;
  if (recoveryStatus !== 'refunded' && recoveryStatus !== 'replaced') {
    throw new AppError(400, 'invalid_request', 'recovery_status must be either refunded or replaced.');
  }
  return {
    recoveryStatus,
    recoveryValue: requireNonNegativeNumber(recoveryInput, 'recovery_value'),
    recoveryDate: requireDate(recoveryInput, 'recovery_date'),
  };
};

// Require complete purchasing details when a supplier sends a distinct replacement bundle.
const readReplacementValues = (recoveryInput: Record<string, unknown>): ReplacementValues => {
  const replacementInput = requireRecord(recoveryInput.new_bundle);
  return {
    type: requireText(replacementInput, 'type'),
    designName: requireText(replacementInput, 'design_name'),
    itemsOrdered: requireNonNegativeInteger(replacementInput, 'items_ordered'),
    costPerItem: requireNonNegativeNumber(replacementInput, 'cost_per_item'),
  };
};

// List immutable transit-loss history with the purchasing and supplier context that caused it.
export const listLossEntries = async (): Promise<LossEntryWithBundle[]> => {
  return prisma.lossEntry.findMany({
    include: { bundle: { include: { order: true } } },
    orderBy: { lossDate: 'desc' },
  });
};

// Record a later recovery while preserving the original loss and updating bundle outcomes atomically.
export const recoverLossEntry = async (lossEntryId: string, body: unknown): Promise<LossEntry> => {
  const recoveryInput = requireRecord(body);
  const recoveryValues = readRecoveryValues(recoveryInput);
  const replacementValues = recoveryValues.recoveryStatus === 'replaced' ? readReplacementValues(recoveryInput) : undefined;

  return prisma.$transaction(async (transaction): Promise<LossEntry> => {
    const lossToRecover = await transaction.lossEntry.findUnique({
      where: { id: lossEntryId },
      include: { bundle: true },
    });
    if (!lossToRecover) throw new AppError(404, 'not_found', 'The loss entry to recover could not be found.');
    if (lossToRecover.recoveryStatus !== 'none' && lossToRecover.recoveryStatus !== 'pending_claim') {
      throw new AppError(422, 'business_rule_violation', 'This loss entry already has a final recovery outcome.', 'LOSS_ALREADY_RECOVERED');
    }
    // business rule: loss type, quantity, value, and date are immutable; recovery is additive only.
    const recoveredLoss = await transaction.lossEntry.update({
      where: { id: lossEntryId },
      data: {
        recoveryStatus: recoveryValues.recoveryStatus as RecoveryStatus,
        recoveryValue: recoveryValues.recoveryValue,
        recoveryDate: recoveryValues.recoveryDate,
      },
    });
    await transaction.bundle.update({
      where: { id: lossToRecover.bundleId },
      data: { status: recoveryValues.recoveryStatus },
    });
    if (recoveryValues.recoveryStatus === 'replaced' && replacementValues) {
      // business rule: replacement creates a distinct pending bundle and never auto-generates inventory.
      await transaction.bundle.create({
        data: { orderId: lossToRecover.bundle.orderId, status: 'pending', ...replacementValues },
      });
    }
    return recoveredLoss;
  });
};
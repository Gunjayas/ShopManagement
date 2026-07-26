import { AppError } from './app-error.js';

// Confirm a request body is an object before services read business fields from it.
export const requireRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new AppError(400, 'invalid_request', 'The request body must be a JSON object.');
  }
  return value as Record<string, unknown>;
};

// Require meaningful text for labels that identify orders and bundles to the owner.
export const requireText = (record: Record<string, unknown>, field: string): string => {
  const value = record[field];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(400, 'invalid_request', `${field} must be a non-empty text value.`);
  }
  return value.trim();
};

// Require a finite non-negative amount or count so invalid shop totals never reach the database.
export const requireNonNegativeNumber = (record: Record<string, unknown>, field: string): number => {
  const value = record[field];
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new AppError(400, 'invalid_request', `${field} must be a non-negative number.`);
  }
  return value;
};

// Require a whole non-negative count because physical clothing items cannot be fractional.
export const requireNonNegativeInteger = (record: Record<string, unknown>, field: string): number => {
  const value = requireNonNegativeNumber(record, field);
  if (!Number.isInteger(value)) throw new AppError(400, 'invalid_request', `${field} must be a whole number.`);
  return value;
};

// Parse an ISO date supplied by the UI while rejecting impossible calendar values.
export const requireDate = (record: Record<string, unknown>, field: string): Date => {
  const value = record[field];
  const parsedDate = typeof value === 'string' ? new Date(value) : new Date(Number.NaN);
  if (Number.isNaN(parsedDate.getTime())) throw new AppError(400, 'invalid_request', `${field} must be a valid date.`);
  return parsedDate;
};
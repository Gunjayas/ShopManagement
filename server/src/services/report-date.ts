import { AppError } from '../lib/app-error.js';

export interface MonthRange {
  start: Date;
  end: Date;
}

// Validate a YYYY-MM value and turn it into an inclusive-start, exclusive-end UTC range.
export const requireMonthRange = (month: unknown): MonthRange => {
  if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new AppError(400, 'invalid_request', 'month must use the YYYY-MM format.');
  }
  const [yearText, monthText] = month.split('-');
  const year = Number(yearText);
  const monthNumber = Number(monthText);
  return {
    start: new Date(Date.UTC(year, monthNumber - 1, 1)),
    end: new Date(Date.UTC(year, monthNumber, 1)),
  };
};

// Accept an optional month filter while keeping all-time reports explicit when it is absent.
export const optionalMonthRange = (month: unknown): MonthRange | undefined => {
  if (month === undefined || month === '') return undefined;
  return requireMonthRange(month);
};

// Validate the dead-stock age threshold so the report always uses a meaningful whole number.
export const requireDays = (days: unknown): number => {
  if (days === undefined || days === '') return 60;
  const parsedDays = typeof days === 'number' ? days : Number(days);
  if (!Number.isInteger(parsedDays) || parsedDays < 0) {
    throw new AppError(400, 'invalid_request', 'days must be a non-negative whole number.');
  }
  return parsedDays;
};
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getBundleProfitability } from '../services/reports/bundle-profitability-service.js';
import { getDeadStock } from '../services/reports/dead-stock-service.js';
import { getDiscountLeakage } from '../services/reports/discount-leakage-service.js';
import { getMonthlyPl } from '../services/reports/monthly-pl-service.js';
import { getMovers } from '../services/reports/movers-service.js';
import { getTransitLosses } from '../services/reports/transit-loss-service.js';

type MonthQuery = { month?: string };
type DaysQuery = { days?: string };

// Return the selected month's profit and expense events using their actual business dates.
const monthlyPlHandler = async (request: FastifyRequest<{ Querystring: MonthQuery }>, reply: FastifyReply): Promise<void> => {
  await reply.status(200).send(await getMonthlyPl(request.query.month));
};

// Return unsold inventory whose bundle arrival date exceeds the requested age.
const deadStockHandler = async (request: FastifyRequest<{ Querystring: DaysQuery }>, reply: FastifyReply): Promise<void> => {
  await reply.status(200).send(await getDeadStock(request.query.days));
};

// Return type-and-design sales groups ordered from fastest to slowest movement.
const moversHandler = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  await reply.status(200).send(await getMovers());
};

// Return historical transit losses, optionally limited by the month each loss was recorded.
const transitLossesHandler = async (request: FastifyRequest<{ Querystring: MonthQuery }>, reply: FastifyReply): Promise<void> => {
  await reply.status(200).send(await getTransitLosses(request.query.month));
};

// Return monthly discounts measured against each item's listed price.
const discountLeakageHandler = async (request: FastifyRequest<{ Querystring: MonthQuery }>, reply: FastifyReply): Promise<void> => {
  await reply.status(200).send(await getDiscountLeakage(request.query.month));
};

// Return every bundle's stored historical profit and transit-loss outcome.
const bundleProfitabilityHandler = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  await reply.status(200).send(await getBundleProfitability());
};

// Register all six read-only report endpoints under one focused API resource.
export const registerReportRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get('/api/reports/monthly-pl', monthlyPlHandler);
  app.get('/api/reports/dead-stock', deadStockHandler);
  app.get('/api/reports/movers', moversHandler);
  app.get('/api/reports/transit-losses', transitLossesHandler);
  app.get('/api/reports/discount-leakage', discountLeakageHandler);
  app.get('/api/reports/bundle-profitability', bundleProfitabilityHandler);
};
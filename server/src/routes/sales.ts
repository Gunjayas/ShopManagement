import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createSale, listSales } from '../services/sale-service.js';

// Accept one sale and return the immutable profit snapshot created for it.
const createSaleHandler = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  await reply.status(201).send(await createSale(request.body));
};

// Return sale history newest first with the sold item's identifying details.
const listSalesHandler = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  await reply.status(200).send(await listSales());
};

// Expose sale creation and history as one focused REST resource.
export const registerSaleRoutes = async (app: FastifyInstance): Promise<void> => {
  app.post('/api/sales', createSaleHandler);
  app.get('/api/sales', listSalesHandler);
};
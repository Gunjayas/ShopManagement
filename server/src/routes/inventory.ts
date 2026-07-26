import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { listInventory, updateInventoryPricing } from '../services/inventory-service.js';

interface InventoryQuery { status?: string }
interface InventoryParams { id: string }

// Return individual stock units, optionally narrowed to one operational status.
const listInventoryHandler = async (request: FastifyRequest<{ Querystring: InventoryQuery }>, reply: FastifyReply): Promise<void> => {
  await reply.status(200).send(await listInventory(request.query.status));
};

// Save pricing guidance without allowing the acquisition cost to be rewritten.
const updatePricingHandler = async (request: FastifyRequest<{ Params: InventoryParams }>, reply: FastifyReply): Promise<void> => {
  await reply.status(200).send(await updateInventoryPricing(request.params.id, request.body));
};

// Expose inventory browsing and pricing through focused REST endpoints.
export const registerInventoryRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get<{ Querystring: InventoryQuery }>('/api/inventory', listInventoryHandler);
  app.patch<{ Params: InventoryParams }>('/api/inventory/:id/pricing', updatePricingHandler);
};
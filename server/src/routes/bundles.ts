import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { arriveBundle, createBundle, listBundles, loseBundle, updateBundle } from '../services/bundle-service.js';

interface OrderParams { orderId: string }
interface BundleParams { id: string }

// Add one purchasing bundle to the order selected by the owner.
const createBundleHandler = async (request: FastifyRequest<{ Params: OrderParams }>, reply: FastifyReply): Promise<void> => {
  await reply.status(201).send(await createBundle(request.params.orderId, request.body));
};

// Return the bundles that make up the selected order.
const listBundlesHandler = async (request: FastifyRequest<{ Params: OrderParams }>, reply: FastifyReply): Promise<void> => {
  await reply.status(200).send(await listBundles(request.params.orderId));
};

// Save corrections while the bundle is still pending and no item costs have been copied.
const updateBundleHandler = async (request: FastifyRequest<{ Params: BundleParams }>, reply: FastifyReply): Promise<void> => {
  await reply.status(200).send(await updateBundle(request.params.id, request.body));
};

// Convert received bundle quantities into individual sellable inventory atomically.
const arriveBundleHandler = async (request: FastifyRequest<{ Params: BundleParams }>, reply: FastifyReply): Promise<void> => {
  await reply.status(200).send(await arriveBundle(request.params.id, request.body));
};

// Record a full transit loss without generating inventory items.
const loseBundleHandler = async (request: FastifyRequest<{ Params: BundleParams }>, reply: FastifyReply): Promise<void> => {
  await reply.status(200).send(await loseBundle(request.params.id));
};

// Expose bundle creation and controlled lifecycle actions through REST endpoints.
export const registerBundleRoutes = async (app: FastifyInstance): Promise<void> => {
  app.post<{ Params: OrderParams }>('/api/orders/:orderId/bundles', createBundleHandler);
  app.get<{ Params: OrderParams }>('/api/orders/:orderId/bundles', listBundlesHandler);
  app.patch<{ Params: BundleParams }>('/api/bundles/:id', updateBundleHandler);
  app.patch<{ Params: BundleParams }>('/api/bundles/:id/arrive', arriveBundleHandler);
  app.patch<{ Params: BundleParams }>('/api/bundles/:id/lost', loseBundleHandler);
};
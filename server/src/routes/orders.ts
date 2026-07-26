import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { closeOrder, createOrder, getOrder, listOrders, updateOrder } from '../services/order-service.js';

interface OrderParams { id: string }

// Create the purchasing header before bundles are attached to it.
const createOrderHandler = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  await reply.status(201).send(await createOrder(request.body));
};

// Return all purchasing records in the service-defined newest-first order.
const listOrdersHandler = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  await reply.status(200).send(await listOrders());
};

// Return the selected order for its detail workspace.
const getOrderHandler = async (request: FastifyRequest<{ Params: OrderParams }>, reply: FastifyReply): Promise<void> => {
  await reply.status(200).send(await getOrder(request.params.id));
};

// Save corrected order fields while leaving status under its dedicated action.
const updateOrderHandler = async (request: FastifyRequest<{ Params: OrderParams }>, reply: FastifyReply): Promise<void> => {
  await reply.status(200).send(await updateOrder(request.params.id, request.body));
};

// Close an order immediately because closure is an owner-controlled bookkeeping action.
const closeOrderHandler = async (request: FastifyRequest<{ Params: OrderParams }>, reply: FastifyReply): Promise<void> => {
  await reply.status(200).send(await closeOrder(request.params.id));
};

// Expose the order lifecycle through REST endpoints under the shared API namespace.
export const registerOrderRoutes = async (app: FastifyInstance): Promise<void> => {
  app.post('/api/orders', createOrderHandler);
  app.get('/api/orders', listOrdersHandler);
  app.get<{ Params: OrderParams }>('/api/orders/:id', getOrderHandler);
  app.patch<{ Params: OrderParams }>('/api/orders/:id', updateOrderHandler);
  app.patch<{ Params: OrderParams }>('/api/orders/:id/status', closeOrderHandler);
};
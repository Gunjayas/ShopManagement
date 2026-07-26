import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { listLossEntries, recoverLossEntry } from '../services/loss-entry-service.js';

interface LossEntryParams { id: string }

// Return transit losses newest first with their bundle and supplier context.
const listLossEntriesHandler = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  await reply.status(200).send(await listLossEntries());
};

// Apply one final recovery outcome without rewriting the historical loss details.
const recoverLossEntryHandler = async (request: FastifyRequest<{ Params: LossEntryParams }>, reply: FastifyReply): Promise<void> => {
  await reply.status(200).send(await recoverLossEntry(request.params.id, request.body));
};

// Expose loss history and its controlled additive recovery action through REST.
export const registerLossEntryRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get('/api/loss-entries', listLossEntriesHandler);
  app.patch<{ Params: LossEntryParams }>('/api/loss-entries/:id/recover', recoverLossEntryHandler);
};
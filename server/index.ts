import 'dotenv/config';
import Fastify from 'fastify';
import staticFiles from '@fastify/static';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from './src/lib/prisma.js';
import { AppError } from './src/lib/app-error.js';
import { registerOrderRoutes } from './src/routes/orders.js';
import { registerBundleRoutes } from './src/routes/bundles.js';
import { registerInventoryRoutes } from './src/routes/inventory.js';

const app = Fastify({ logger: true });
const serverDirectory = fileURLToPath(new URL('.', import.meta.url));
const projectDirectory = serverDirectory.endsWith(`${join('dist', 'server')}\\`) || serverDirectory.endsWith(`${join('dist', 'server')}/`)
  ? join(serverDirectory, '../../..')
  : join(serverDirectory, '..');

// Recognize Fastify parser failures without weakening strict error typing.
const isBadRequestError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) return false;
  return error.statusCode === 400;
};

// Register every business resource under the shared API namespace.
await registerOrderRoutes(app);
await registerBundleRoutes(app);
await registerInventoryRoutes(app);

// Serve the production client from Fastify so the shop can run as one Termux process.
await app.register(staticFiles, { root: join(projectDirectory, 'client/dist'), wildcard: false });

// Keep client-side routes working when the owner refreshes a detail page.
app.setNotFoundHandler(async (request, reply): Promise<void> => {
  if (request.url.startsWith('/api/')) {
    await reply.status(404).send({ error: 'not_found', message: 'The requested API endpoint does not exist.' });
    return;
  }
  await reply.sendFile('index.html');
});

// Translate known service failures into consistent, plain-English API responses.
app.setErrorHandler(async (error, _request, reply): Promise<void> => {
  if (error instanceof AppError) {
    await reply.status(error.statusCode).send({ error: error.error, code: error.code, message: error.message });
    return;
  }
  if (isBadRequestError(error)) {
    await reply.status(400).send({ error: 'invalid_request', message: 'The request body is not valid JSON.' });
    return;
  }
  app.log.error(error);
  await reply.status(500).send({ error: 'internal_error', message: 'Something went wrong while processing the request.' });
});

// Start the server on all interfaces so Android devices can reach the shop app.
const startServer = async (): Promise<void> => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
  } catch (error) {
    app.log.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

await startServer();
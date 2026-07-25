import 'dotenv/config';
import Fastify from 'fastify';
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import type { Order } from '@shared/types.js';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });
const app = Fastify({ logger: true });
app.get('/api/health', async () => {
  const orderCount = await prisma.order.count();
  return { status: 'ok', orderCount };
});

const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    
    app.log.error(err);
    process.exit(1);
  }
};

start();
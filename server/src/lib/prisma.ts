import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../../generated/prisma/client.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required to connect to the shop database.');
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });

// Share one client so every service uses the same database connection pool.
export const prisma = new PrismaClient({ adapter });
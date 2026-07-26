import 'dotenv/config';
import { DatabaseSync } from 'node:sqlite';
import { PrismaGenericBetterSQLite3 } from 'prisma-generic-better-sqlite3';
import { PrismaClient } from '../../generated/prisma/client.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required to connect to the shop database.');

// DatabaseSync (node:sqlite) wants a plain file path, not Prisma's "file:" URL scheme.
const dbFilePath = databaseUrl.replace(/^file:/, '');
const database = new DatabaseSync(dbFilePath);
const adapter = new PrismaGenericBetterSQLite3({ database });

// Share one client so every service uses the same database connection pool.
export const prisma = new PrismaClient({ adapter });
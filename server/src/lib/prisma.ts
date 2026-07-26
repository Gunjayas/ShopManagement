import 'dotenv/config';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '../../generated/prisma/client.js';

const adapter = new PrismaLibSql({ url: 'file:./prisma/shop.db' });

// Share one client so every service uses the same database connection pool.
export const prisma = new PrismaClient({ adapter });
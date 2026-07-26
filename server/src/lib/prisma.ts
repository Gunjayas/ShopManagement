import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// Prisma 6's built-in query engine talks to SQLite directly — no driver
// adapter needed, so nothing here requires native compilation on Android.
export const prisma = new PrismaClient();
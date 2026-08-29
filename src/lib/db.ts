import { PrismaClient } from '@prisma/client';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;

  // If environment variable is set to a non-file URL (e.g., PostgreSQL in production Vercel)
  if (envUrl && !envUrl.startsWith('file:')) {
    return envUrl.trim();
  }

  // For local SQLite, resolve the absolute path to prisma/dev.db
  // This prevents SQLite Error Code 14 ("Unable to open database file") caused by relative CWD mismatch.
  const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db');
  return `file:${dbPath}`;
}

const resolvedUrl = getDatabaseUrl();
process.env.DATABASE_URL = resolvedUrl;

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolvedUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

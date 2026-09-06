import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export interface DatabaseResolutionInfo {
  url: string;
  provider: 'sqlite' | 'postgresql' | 'mysql' | 'other';
  isServerless: boolean;
  isCustomUrl: boolean;
  filePath?: string;
  fileDirectoryExists?: boolean;
}

/**
 * Resolves the database URL safely across all platforms (Windows, Linux, macOS)
 * and hosting environments (Vercel Serverless, Docker, Local Development).
 */
export function resolveDatabaseUrl(): { resolvedUrl: string; info: DatabaseResolutionInfo } {
  const envUrl = process.env.DATABASE_URL?.trim();
  const isServerless = process.env.VERCEL === '1' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

  // Check if an external SQL database URL was supplied
  if (envUrl && !envUrl.startsWith('file:')) {
    let provider: DatabaseResolutionInfo['provider'] = 'other';
    if (envUrl.startsWith('postgres://') || envUrl.startsWith('postgresql://')) {
      provider = 'postgresql';
    } else if (envUrl.startsWith('mysql://')) {
      provider = 'mysql';
    }

    return {
      resolvedUrl: envUrl,
      info: {
        url: envUrl.replace(/:\/\/.*@/, '://***:***@'), // Mask credentials
        provider,
        isServerless,
        isCustomUrl: true,
      },
    };
  }

  // SQLite Resolution
  let targetDbPath: string;

  if (isServerless) {
    // In serverless environments (e.g. Vercel), the root file system is read-only.
    // Use /tmp for writable SQLite operations.
    targetDbPath = path.join('/tmp', 'dev.db');
    const sourceDbPath = path.resolve(process.cwd(), 'prisma', 'dev.db');

    try {
      if (!fs.existsSync(targetDbPath) && fs.existsSync(sourceDbPath)) {
        fs.copyFileSync(sourceDbPath, targetDbPath);
      }
    } catch (e) {
      console.warn('[db] Note: Could not clone seed dev.db to /tmp:', (e as Error).message);
    }
  } else if (envUrl && envUrl.startsWith('file:')) {
    const rawPath = envUrl.replace(/^file:/, '');
    if (path.isAbsolute(rawPath)) {
      targetDbPath = rawPath;
    } else {
      // Relative file paths in Next.js execute from process.cwd()
      // If path specifies ./dev.db, check whether it's located in prisma/ or root
      const inPrisma = path.resolve(process.cwd(), 'prisma', rawPath.replace(/^\.\//, ''));
      const inRoot = path.resolve(process.cwd(), rawPath.replace(/^\.\//, ''));
      targetDbPath = fs.existsSync(inPrisma) ? inPrisma : inRoot;
    }
  } else {
    // Default local database path: prisma/dev.db
    targetDbPath = path.resolve(process.cwd(), 'prisma', 'dev.db');
  }

  // Ensure the parent directory exists to prevent SQLite Error 14
  const dir = path.dirname(targetDbPath);
  let fileDirectoryExists = false;
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fileDirectoryExists = true;
  } catch (err) {
    console.warn('[db] Failed to ensure directory exists:', dir, (err as Error).message);
  }

  // Normalize Windows backslashes to forward slashes for valid file: URI format
  // Example: "c:/Users/.../dev.db" instead of "c:\Users\...\dev.db"
  const normalizedPath = targetDbPath.replace(/\\/g, '/');
  const resolvedUrl = `file:${normalizedPath}`;

  return {
    resolvedUrl,
    info: {
      url: resolvedUrl,
      provider: 'sqlite',
      isServerless,
      isCustomUrl: Boolean(envUrl),
      filePath: normalizedPath,
      fileDirectoryExists,
    },
  };
}

// Global cached client for development fast-refresh to prevent connection leaks
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  databaseResolutionInfo: DatabaseResolutionInfo | undefined;
};

const resolution = resolveDatabaseUrl();

// Ensure process.env.DATABASE_URL reflects the normalized URL
process.env.DATABASE_URL = resolution.resolvedUrl;

export const databaseResolutionInfo = resolution.info;

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolution.resolvedUrl,
      },
    },
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
  globalForPrisma.databaseResolutionInfo = resolution.info;
}

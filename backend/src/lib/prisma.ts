import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prismaClient ||
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  global.__prismaClient = prisma;
}

/**
 * Validates database connectivity without crashing the process.
 */
export async function checkDbConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Database connection failed';
    return { connected: false, error: errorMsg };
  }
}

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const DEFAULT_DATABASE_URL =
  'postgresql://postgres:postgres@127.0.0.1:5432/material_chat';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  // Prisma 7 requires a driver adapter. The fallback URL keeps import-time
  // Next.js route analysis side-effect free; real requests still use the
  // configured DATABASE_URL in development, CI UAT, and production.
  const connectionString = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

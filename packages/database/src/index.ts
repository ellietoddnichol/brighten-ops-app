import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
// (e.g. hot-reloading in Next.js / tsx watch mode).

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const _prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = _prisma;
}

// Exported as `any` so consumers (e.g. apps/api) do not transitively load
// the 11 000-line Prisma-generated `index.d.ts`, which causes TypeScript to
// hang. Type safety for database queries is enforced within this package.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: any = _prisma;

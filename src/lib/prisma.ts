import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Cache on globalThis in every environment, not just dev — on Vercel a warm
// serverless instance re-evaluates this module across invocations, and
// without reusing the same client each one opened a fresh connection pool
// against Supabase's pooler, exhausting its pool_size: 15 limit under any
// real concurrent load ("max clients reached in session mode").
globalForPrisma.prisma = prisma;

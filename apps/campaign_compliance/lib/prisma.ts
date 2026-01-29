// apps/campaign_compliance/lib/prisma.ts
/**
 * prisma.ts — Prisma client singleton
 *
 * Requirements (from master_build.md):
 * - Export one PrismaClient instance
 * - Prevent multiple instances in dev (Next.js hot reload safe)
 */

import { PrismaClient } from "@prisma/client";
import { assertEnv } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var __campaignPrisma: PrismaClient | undefined;
}

function createClient() {
  // Ensure required env vars are present before connecting
  assertEnv();

  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma: PrismaClient =
  global.__campaignPrisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  global.__campaignPrisma = prisma;
}

export default prisma;

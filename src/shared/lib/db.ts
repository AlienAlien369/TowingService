import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "./env";

// One client per server instance (survives HMR in dev).
const g = globalThis as unknown as { __prisma?: PrismaClient };

function create() {
  const adapter = new PrismaPg({ connectionString: env.databaseUrl, max: 10 });
  return new PrismaClient({ adapter });
}

export const db: PrismaClient = g.__prisma ?? create();
if (!env.isProd) g.__prisma = db;

export type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

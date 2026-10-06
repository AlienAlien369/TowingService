import "dotenv/config";
import { defineConfig } from "prisma/config";

// DIRECT_URL (non-pooled) is preferred for migrations on Neon; falls back to DATABASE_URL.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/towing",
  },
});

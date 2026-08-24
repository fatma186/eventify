// Prisma 7 configuration.
// Prisma 7 does NOT auto-load `.env` — load it explicitly here.
// The seed is registered here; the seed script itself is written in a later step.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: "node --env-file=.env prisma/seed.ts",
  },
});

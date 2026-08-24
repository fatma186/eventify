// Prisma client singleton wired to PostgreSQL through the pg driver adapter.
// `DATABASE_URL` comes from `src/config.ts` — process.env is never read here.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import { config } from "../config.ts";

const adapter = new PrismaPg({ connectionString: config.databaseUrl });

export const prisma = new PrismaClient({ adapter });
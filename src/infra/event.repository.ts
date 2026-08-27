import { prisma } from "./db.ts";

export async function listEvents(params?: {
  page?: number;
  limit?: number;
  venue?: string;
  from?: Date;
  to?: Date;
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;

  const where = {
    ...(params?.venue ? { venue: params.venue } : {}),
    ...(params?.from || params?.to
      ? {
          startsAt: {
            ...(params.from ? { gte: params.from } : {}),
            ...(params.to ? { lte: params.to } : {}),
          },
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: {
        startsAt: "asc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  return {
    data,
    page,
    limit,
    total,
  };
}

export async function getEventById(id: string) {
  return prisma.event.findUnique({
    where: {
      id,
    },
  });
}
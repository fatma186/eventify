import { prisma } from "../src/infra/db.ts";

async function main(): Promise<void> {
  // 1. Organizer
  const organizer = await prisma.user.upsert({
    where: {
      email: "session3-organizer@example.com",
    },
    update: {},
    create: {
      email: "session3-organizer@example.com",
      name: "Session 3 Organizer",
      role: "ORGANIZER",
    },
  });

  // 2. Admin
  await prisma.user.upsert({
    where: {
      email: "session3-admin@example.com",
    },
    update: {},
    create: {
      email: "session3-admin@example.com",
      name: "Session 3 Admin",
      role: "ADMIN",
    },
  });

  // 3. 20 farklı attendee
  const users = [];

  for (let i = 1; i <= 20; i++) {
    const user = await prisma.user.upsert({
      where: {
        email: `session3-user-${i}@example.com`,
      },
      update: {},
      create: {
        email: `session3-user-${i}@example.com`,
        name: `Session 3 User ${i}`,
        role: "ATTENDEE",
      },
    });

    users.push(user);
  }

  // 4. Beş event
  const eventData = [
    {
      title: "Session 3 Capacity Test",
      description: "Capacity test event for the parallel booking exercise.",
      venue: "Test Hall",
      startsAt: new Date("2026-09-15T18:00:00Z"),
      capacity: 5,
      priceCents: 1500,
    },
    {
      title: "Node.js Workshop",
      description: "Backend development workshop.",
      venue: "Tech Hall",
      startsAt: new Date("2026-09-20T18:00:00Z"),
      capacity: 50,
      priceCents: 2500,
    },
    {
      title: "TypeScript Deep Dive",
      description: "Advanced TypeScript session.",
      venue: "Conference Room A",
      startsAt: new Date("2026-09-25T18:00:00Z"),
      capacity: 100,
      priceCents: 3000,
    },
    {
      title: "PostgreSQL Fundamentals",
      description: "Introduction to PostgreSQL.",
      venue: "Database Lab",
      startsAt: new Date("2026-10-01T18:00:00Z"),
      capacity: 30,
      priceCents: 2000,
    },
    {
      title: "API Design Workshop",
      description: "REST API design and backend architecture.",
      venue: "Innovation Hub",
      startsAt: new Date("2026-10-05T18:00:00Z"),
      capacity: 40,
      priceCents: 3500,
    },
  ];

  const events = [];

  for (const data of eventData) {
    const existing = await prisma.event.findFirst({
      where: {
        title: data.title,
      },
    });

    const event = existing
      ? await prisma.event.update({
          where: {
            id: existing.id,
          },
          data: {
            ...data,
            organizerId: organizer.id,
          },
        })
      : await prisma.event.create({
          data: {
            ...data,
            organizerId: organizer.id,
          },
        });

    events.push(event);
  }

  // 5. Bazı booking kayıtları
  for (let i = 0; i < 3; i++) {
    await prisma.booking.upsert({
      where: {
        userId_eventId: {
          userId: users[i].id,
          eventId: events[1].id,
        },
      },
      update: {
        status: "CONFIRMED",
      },
      create: {
        userId: users[i].id,
        eventId: events[1].id,
        status: "CONFIRMED",
      },
    });
  }

  console.log("Seed completed successfully.");
  console.log(`Organizer: ${organizer.id}`);
  console.log(`Capacity-5 event: ${events[0].id}`);
  console.log(`Parallel test users: ${users.length}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
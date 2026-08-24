/**
 * Session 3 — parallel booking concurrency harness.
 *
 * Fires one POST /v1/bookings request per { userId, token } entry in
 * scripts/fixtures/parallel-users.json (20 by default), all at once, for the
 * fixture's target event. Prints a status-code tally and exits with a non-zero
 * status if the event was oversold (more 201 responses than its capacity).
 *
 * Authentication arrives in Session 4, so the fixture tokens are empty strings
 * and the request body carries only the eventId accepted by the current API.
 *
 * Run (with the server up on the fixture's baseUrl):
 *   node scripts/parallel-bookings.ts
 */
import { readFileSync } from "node:fs";

type FixtureUser = {
  userId: string;
  token: string;
};

type Fixture = {
  baseUrl: string;
  eventId: string;
  capacity: number;
  users: FixtureUser[];
};

const fixtureUrl = new URL("./fixtures/parallel-users.json", import.meta.url);

function readFixture(path: URL): Fixture {
  const raw: unknown = JSON.parse(readFileSync(path, "utf8"));

  if (typeof raw !== "object" || raw === null) {
    throw new Error(`${path.pathname}: fixture must be a JSON object.`);
  }

  const record = raw as Record<string, unknown>;

  const baseUrl = record.baseUrl;
  const eventId = record.eventId;
  const capacity = record.capacity;
  const users = record.users;

  if (typeof baseUrl !== "string" || baseUrl.length === 0) {
    throw new Error(`${path.pathname}: "baseUrl" must be a non-empty string.`);
  }

  if (typeof eventId !== "string" || eventId.length === 0) {
    throw new Error(`${path.pathname}: "eventId" must be a non-empty string.`);
  }

  if (typeof capacity !== "number" || !Number.isInteger(capacity) || capacity < 1) {
    throw new Error(
      `${path.pathname}: "capacity" must be a positive integer.`,
    );
  }

  if (!Array.isArray(users)) {
    throw new Error(`${path.pathname}: "users" must be an array.`);
  }

  const parsedUsers = users.map((entry) => {
    if (typeof entry !== "object" || entry === null) {
      throw new Error(`${path.pathname}: each user entry must be an object.`);
    }

    const user = entry as Record<string, unknown>;

    if (typeof user.userId !== "string" || user.userId.length === 0) {
      throw new Error(
        `${path.pathname}: each user needs a non-empty "userId" string.`,
      );
    }

    if (typeof user.token !== "string") {
      throw new Error(`${path.pathname}: each user needs a "token" string.`);
    }

    return { userId: user.userId, token: user.token };
  });

  return { baseUrl, eventId, capacity, users: parsedUsers };
}

async function postBooking(fixture: Fixture, user: FixtureUser): Promise<number> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Authentication is a Session 4 feature; fixture tokens stay empty until then.
  if (user.token.length > 0) {
    headers.Authorization = `Bearer ${user.token}`;
  }

  try {
    const response = await fetch(`${fixture.baseUrl}/v1/bookings`, {
      method: "POST",
      headers,
      body: JSON.stringify({
  eventId: fixture.eventId,
  userId: user.userId,
}),
    });

    // Drain the body so connection pooling behaves.
    await response.text();

    return response.status;
  } catch (error) {
    throw new Error(
      `Request for user "${user.userId}" failed: ${(error as Error).message}`,
      { cause: error },
    );
  }
}

async function main(): Promise<void> {
  const fixture = readFixture(fixtureUrl);

  console.log(
    `Firing ${fixture.users.length} simultaneous POST /v1/bookings requests for event ` +
      `${fixture.eventId} (capacity ${fixture.capacity})`,
  );

  const results = await Promise.all(
    fixture.users.map(async (user) => ({
      user,
      status: await postBooking(fixture, user),
    })),
  );

  for (const result of results) {
    console.log(`  ${result.user.userId} -> ${result.status}`);
  }

  const tally = new Map<number, number>();

  for (const result of results) {
    tally.set(result.status, (tally.get(result.status) ?? 0) + 1);
  }

  console.log("Status-code tally:");
  for (const status of [...tally.keys()].sort((a, b) => a - b)) {
    console.log(`  ${status}: ${tally.get(status)}`);
  }

  const successes = tally.get(201) ?? 0;
  console.log(`Successful (201) bookings: ${successes} of capacity ${fixture.capacity}`);

  if (successes > fixture.capacity) {
    console.error(
      `OVERSOLD: ${successes} bookings exceed capacity ${fixture.capacity}.`,
    );
    process.exitCode = 1;
  } else {
    console.log(
      `Not oversold: ${successes} bookings is at or below capacity ${fixture.capacity}.`,
    );
  }
}

await main();
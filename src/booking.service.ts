import { Prisma } from "./generated/prisma/client.ts";
import { prisma } from "./infra/db.ts";
import { HttpError } from "./http-error.ts";

/**
 * Small, bounded retry for concurrent booking transactions.
 *
 * With Serializable isolation, two transactions that race on the same event
 * can abort one another with a write conflict (Prisma error code P2034 that
 * surfaces PostgreSQL SQLSTATE 40001 "serialization_failure"). These are
 * transient: the losing transaction only lost the race, so re-running the
 * whole transaction is safe and lets it observe the committed result. We
 * retry a bounded number of times instead of letting the conflict bubble up
 * and become an HTTP 500.
 */
const MAX_TRANSACTION_RETRIES = 3;
const TRANSACTION_RETRY_DELAY_MS = 25;

function isRetryableTransactionConflict(error: unknown): boolean {
  // Prisma surfaces the PostgreSQL 40001 write conflict as a known request
  // error with code P2034.
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  ) {
    return true;
  }

  // With the pg driver adapter, a serialization failure can surface as the
  // raw adapter error instead of a Prisma P2034 wrapper. It is a plain object
  // shaped like { kind: "TransactionWriteConflict", originalCode: "40001",
  // originalMessage: "could not serialize access ..." }.
  if (isObjectLike(error)) {
    const code = error.originalCode;
    if (error.kind === "TransactionWriteConflict") return true;
    if (code === "40001") return true;
  }

  // Defensive fallback: inspect any readable text for a serialization
  // write-conflict indicator (P2034, SQLSTATE 40001, "serialize", ...).
  const text = [
    error instanceof Error ? error.message : "",
    isObjectLike(error) ? JSON.stringify(error) : "",
    isObjectLike(error) && typeof error.originalMessage === "string"
      ? error.originalMessage
      : "",
  ]
    .filter((part) => part.length > 0)
    .join(" ");
  return /P2034|\b40001\b|serializ|write conflict|deadlock/i.test(text);
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTransactionRetry<T>(
  operation: () => Promise<T>
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_TRANSACTION_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (!isRetryableTransactionConflict(error)) {
        throw error;
      }
      lastError = error;
      if (attempt < MAX_TRANSACTION_RETRIES) {
        await delay(TRANSACTION_RETRY_DELAY_MS);
      }
    }
  }
  throw lastError;
}

export async function createBooking(
  userId: string,
  eventId: string
) {
  try {
    return await withTransactionRetry(() =>
      prisma.$transaction(
        async (tx) => {
          // Check if event exists
          const event = await tx.event.findUnique({
            where: { id: eventId },
          });

          if (!event) {
            throw new HttpError(404, "Event not found");
          }

          // Count only CONFIRMED bookings
          const confirmedCount = await tx.booking.count({
            where: {
              eventId,
              status: "CONFIRMED",
            },
          });

          if (confirmedCount >= event.capacity) {
            throw new HttpError(409, "Event at capacity");
          }

          // Check existing booking
          const existingBooking = await tx.booking.findUnique({
            where: {
              userId_eventId: {
                userId,
                eventId,
              },
            },
          });

          // Rebook a cancelled booking
          if (existingBooking?.status === "CANCELLED") {
            return tx.booking.update({
              where: {
                id: existingBooking.id,
              },
              data: {
                status: "CONFIRMED",
              },
            });
          }

          // WAITLISTED bookings stay untouched
          if (existingBooking?.status === "WAITLISTED") {
            return existingBooking;
          }

          // Create a new booking
          return tx.booking.create({
            data: {
              userId,
              eventId,
              status: "CONFIRMED",
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      )
    );
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    // Duplicate CONFIRMED booking
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new HttpError(
        409,
        "User already has a booking for this event"
      );
    }

    throw error;
  }
}

export async function getBookingById(id: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
  });

  return booking ?? undefined;
}

export async function cancelBooking(id: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
  });

  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }

  return prisma.booking.update({
    where: { id },
    data: {
      status: "CANCELLED",
    },
  });
}
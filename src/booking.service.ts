import type { Booking, Event } from "./domain.ts";
import { HttpError } from "./http-error.ts";

const bookingStore = new Map<string, Booking>();

export function createBooking(
  userId: string,
  eventId: string,
  events: Map<string, Event>
): Booking {
  // Check if event exists
  const event = events.get(eventId);
  if (!event) {
    throw new HttpError(404, "Event not found");
  }

  // Check duplicate booking (any status)
  for (const booking of bookingStore.values()) {
    if (booking.userId === userId && booking.eventId === eventId) {
      throw new HttpError(
        409,
        "User already has a booking for this event"
      );
    }
  }

  // Check capacity (CONFIRMED only)
  const confirmedCount = Array.from(bookingStore.values()).filter(
    (b) => b.eventId === eventId && b.status === "CONFIRMED"
  ).length;

  if (confirmedCount >= event.capacity) {
    throw new HttpError(409, "Event at capacity");
  }

  const booking: Booking = {
    id: crypto.randomUUID(),
    userId,
    eventId,
    status: "CONFIRMED",
    createdAt: new Date().toISOString(),
  };

  bookingStore.set(booking.id, booking);
  return booking;
}

export function getBookingById(id: string): Booking | undefined {
  return bookingStore.get(id);
}

export function cancelBooking(id: string): Booking {
  const booking = bookingStore.get(id);
  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }

  booking.status = "CANCELLED";
  bookingStore.set(id, booking);
  return booking;
}

export function getBookingStore(): Map<string, Booking> {
  return bookingStore;
}

import type { Venue } from "./domain.ts";
import { HttpError } from "./http-error.ts";

const venueStore = new Map<string, Venue>();

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function generateTimestamp(): string {
  return new Date().toISOString();
}

export function createVenue(
  name: string,
  address: string,
  capacity: number,
  contactEmail: string
): Venue {
  // Check if name is unique
  for (const venue of venueStore.values()) {
    if (venue.name === name) {
      throw new HttpError(409, "Venue name already exists");
    }
  }

  const venue: Venue = {
    id: generateId(),
    name,
    address,
    capacity,
    contactEmail,
    createdAt: generateTimestamp(),
  };

  venueStore.set(venue.id, venue);
  return venue;
}

export function listVenues(limit?: number): Venue[] {
  const venues = Array.from(venueStore.values());
  if (limit && limit > 0) {
    return venues.slice(0, limit);
  }
  return venues;
}

export function getVenueById(id: string): Venue | undefined {
  return venueStore.get(id);
}

export function updateVenue(
  id: string,
  updates: Partial<Omit<Venue, "id" | "createdAt">>
): Venue {
  const venue = venueStore.get(id);
  if (!venue) {
    throw new HttpError(404, "Venue not found");
  }

  // Check name uniqueness if name is being updated
  if (updates.name && updates.name !== venue.name) {
    for (const existingVenue of venueStore.values()) {
      if (existingVenue.name === updates.name) {
        throw new HttpError(409, "Venue name already exists");
      }
    }
  }

  const updated: Venue = {
    ...venue,
    ...updates,
  };

  venueStore.set(id, updated);
  return updated;
}

export function deleteVenue(id: string): void {
  if (!venueStore.has(id)) {
    throw new HttpError(404, "Venue not found");
  }
  venueStore.delete(id);
}

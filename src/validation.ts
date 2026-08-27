import { z } from "zod";

// Booking POST body
export const createBookingSchema = z.strictObject({
  eventId: z.string().min(1, "eventId is required"),
  userId: z.string().uuid("userId must be a valid UUID"),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// Events query parameters
export const eventsQuerySchema = z.object({
  page: z
  .string()
  .optional()
  .default("1")
  .refine((value) => /^\d+$/.test(value), {
    message: "page must be an integer",
  })
  .transform(Number)
  .pipe(z.number().int().min(1, "page must be >= 1")),

limit: z
  .string()
  .optional()
  .default("20")
  .refine((value) => /^\d+$/.test(value), {
    message: "limit must be an integer",
  })
  .transform(Number)
  .pipe(z.number().int().min(1).max(100, "limit must be between 1-100")),
  venue: z.string().optional(),
from: z
  .string()
  .optional()
  .transform((v) => (v ? new Date(v) : undefined))
  .refine(
    (date) => date === undefined || !Number.isNaN(date.getTime()),
    "from must be a valid date",
  ),

to: z
  .string()
  .optional()
  .transform((v) => (v ? new Date(v) : undefined))
  .refine(
    (date) => date === undefined || !Number.isNaN(date.getTime()),
    "to must be a valid date",
  ),
});

export type EventsQueryInput = z.infer<typeof eventsQuerySchema>;

export const createVenueSchema = z.strictObject({
  name: z.string().min(1, "name is required"),
  address: z.string().min(1, "address is required"),
  capacity: z.number().int().positive("capacity must be a positive integer"),
  contactEmail: z.string().email("contactEmail must be a valid email"),
});

export const updateVenueSchema = z.strictObject({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  capacity: z.number().int().positive().optional(),
  contactEmail: z.string().email().optional(),
});

export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
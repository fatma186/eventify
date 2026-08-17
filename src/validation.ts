import { z } from "zod";

// Booking POST body
export const createBookingSchema = z.strictObject({
  eventId: z.string().min(1, "eventId is required"),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// Events query parameters
export const eventsQuerySchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (!v) return 1;
      const num = typeof v === "string" ? parseInt(v) : v;
      return isNaN(num) ? 1 : num;
    })
    .pipe(z.number().int().min(1, "page must be >= 1")),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (!v) return 20;
      const num = typeof v === "string" ? parseInt(v) : v;
      return isNaN(num) ? 20 : num;
    })
    .pipe(z.number().int().min(1).max(100, "limit must be between 1-100")),
  venue: z.string().optional(),
  from: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  to: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
});

export type EventsQueryInput = z.infer<typeof eventsQuerySchema>;

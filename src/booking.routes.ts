import { IncomingMessage, ServerResponse } from "node:http";
import type { Event } from "./domain.ts";
import { HttpError } from "./http-error.ts";
import {
  createBooking,
  getBookingById,
  cancelBooking,
} from "./booking.service.ts";
import { createBookingSchema } from "./validation.ts";

// Hard-coded current user (Session 4'te auth gelecek)
const CURRENT_USER_ID = "user-1";

export function handleBookingRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  events: Map<string, Event>
): boolean {
  if (!req.url?.startsWith("/v1/bookings")) {
    return false;
  }

  // POST /v1/bookings - create
  if (req.method === "POST" && req.url === "/v1/bookings") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        
        // Validate with Zod
        const validated = createBookingSchema.parse(data);
        
        const booking = createBooking(CURRENT_USER_ID, validated.eventId, events);
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify(booking));
      } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid request body" }));
        } else if (error instanceof HttpError) {
          res.writeHead(error.statusCode, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: error.message }));
        } else {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal server error" }));
        }
      }
    });
    return true;
  }

  // GET /v1/bookings/:id
  if (
    req.method === "GET" &&
    req.url?.match(/^\/v1\/bookings\/[^/]+$/)
  ) {
    try {
      const id = req.url.split("/")[3]!;
      const booking = getBookingById(id);
      if (!booking) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Booking not found" }));
        return true;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(booking));
    } catch {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
    return true;
  }

  // DELETE /v1/bookings/:id - cancel
  if (
    req.method === "DELETE" &&
    req.url?.match(/^\/v1\/bookings\/[^/]+$/)
  ) {
    try {
      const id = req.url.split("/")[3]!;
      const booking = cancelBooking(id);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(booking));
    } catch (error) {
      if (error instanceof HttpError) {
        res.writeHead(error.statusCode, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      } else {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    }
    return true;
  }

  return false;
}

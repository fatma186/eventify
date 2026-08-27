import { IncomingMessage, ServerResponse } from "node:http";
import { HttpError } from "./http-error.ts";
import {
  createBooking,
  getBookingById,
  cancelBooking,
} from "./booking.service.ts";
import { createBookingSchema } from "./validation.ts";
import { validate } from "./middleware.ts";



export async function handleBookingRoutes(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  if (!req.url?.startsWith("/v1/bookings")) {
    return false;
  }

  // POST /v1/bookings - create
  if (req.method === "POST" && req.url === "/v1/bookings") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const data = JSON.parse(body);

        const validated = validate(data, createBookingSchema);

        const booking = await createBooking(
  validated.userId,
  validated.eventId,
);

        res.writeHead(201, {
          "Content-Type": "application/json",
        });

        res.end(JSON.stringify(booking));
      } catch (error) {
        if (error instanceof SyntaxError) {
          res.writeHead(400, {
            "Content-Type": "application/json",
          });

          res.end(
            JSON.stringify({
              error: "Invalid request body",
            }),
          );

          return;
        }

        if (error instanceof HttpError) {
          res.writeHead(error.statusCode, {
            "Content-Type": "application/json",
          });

          res.end(
            JSON.stringify({
              error: error.message,
            }),
          );

          return;
        }

        console.error("Create booking error:", error);

        res.writeHead(500, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            error: "Internal server error",
          }),
        );
      }
    });

    return true;
  }

  // GET /v1/bookings/:id
  if (
    req.method === "GET" &&
    req.url?.match(/^\/v1\/bookings\/[^/]+$/)
  ) {
    const id = req.url.split("/")[3];

    if (!id) {
      res.writeHead(400, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          error: "Booking id is required",
        }),
      );

      return true;
    }

    const booking = await getBookingById(id);

    if (!booking) {
      res.writeHead(404, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          error: "Booking not found",
        }),
      );

      return true;
    }

    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(JSON.stringify(booking));

    return true;
  }

  // DELETE /v1/bookings/:id - cancel
  if (
    req.method === "DELETE" &&
    req.url?.match(/^\/v1\/bookings\/[^/]+$/)
  ) {
    const id = req.url.split("/")[3];

    if (!id) {
      res.writeHead(400, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          error: "Booking id is required",
        }),
      );

      return true;
    }

    try {
      const booking = await cancelBooking(id);

      res.writeHead(200, {
        "Content-Type": "application/json",
      });

      res.end(JSON.stringify(booking));
    } catch (error) {
      if (error instanceof HttpError) {
        res.writeHead(error.statusCode, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            error: error.message,
          }),
        );

        return true;
      }

      throw error;
    }

    return true;
  }

  return false;
}
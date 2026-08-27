import { createServer } from "node:http";
import { handleVenueRoutes } from "./venue.routes.ts";
import { handleBookingRoutes } from "./booking.routes.ts";
import { eventsQuerySchema } from "./validation.ts";
import { validateQuery } from "./middleware.ts";
import { handleError } from "./error.middleware.ts";
import {
  getEventById,
  listEvents,
} from "./infra/event.repository.ts";

const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });

      res.end(
        JSON.stringify({
          status: "ok",
          uptime: process.uptime(),
        }),
      );

      return;
    }

    // GET /events
    if (req.method === "GET" && req.url === "/events") {
      const result = await listEvents();

      res.writeHead(200, {
        "Content-Type": "application/json",
      });

      res.end(JSON.stringify(result.data));

      return;
    }

    // GET /events/:id
    if (req.method === "GET" && req.url?.startsWith("/events/")) {
      const id = req.url.split("/")[2];

      if (!id) {
        res.writeHead(400, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            error: "Event id is required",
          }),
        );

        return;
      }

      const event = await getEventById(id);

      if (!event) {
        res.writeHead(404, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            error: "Event not found",
          }),
        );

        return;
      }

      res.writeHead(200, {
        "Content-Type": "application/json",
      });

      res.end(JSON.stringify(event));

      return;
    }

    // GET /v1/events with pagination and filtering
    if (req.method === "GET" && req.url?.startsWith("/v1/events")) {
      try {
        const query = validateQuery(
          req,
          res,
          eventsQuerySchema,
        );

        const result = await listEvents({
          page: query.page,
          limit: query.limit,
          venue: query.venue,
          from: query.from,
          to: query.to,
        });

        res.writeHead(200, {
          "Content-Type": "application/json",
        });

        res.end(JSON.stringify(result));
      } catch (error) {
        handleError(res, error);
      }

      return;
    }

    if (handleVenueRoutes(req, res)) {
      return;
    }

    if (await handleBookingRoutes(req, res)) {
      return;
    }

    res.writeHead(404, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        error: "Not found",
      }),
    );
  } catch (error) {
    console.error("Unhandled error:", error);
    handleError(res, error);
  }
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
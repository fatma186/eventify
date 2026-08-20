import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import type { Event } from "./domain.ts";
import { handleVenueRoutes } from "./venue.routes.ts";
import { handleBookingRoutes } from "./booking.routes.ts";
import { eventsQuerySchema } from "./validation.ts";
import { validateQuery } from "./middleware.ts";
import { handleError } from "./error.middleware.ts";

async function loadEvents(): Promise<Event[]> {
  const file = await readFile("./data/events.json", "utf-8");
  return JSON.parse(file) as Event[];
}

const eventsStore = new Map<string, Event>();

async function initializeEventsStore() {
  const events = await loadEvents();

  for (const event of events) {
    eventsStore.set(event.id, event);
  }
}

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

    if (req.method === "GET" && req.url === "/events") {
      try {
        const events = await loadEvents();

        res.writeHead(200, {
          "Content-Type": "application/json",
        });

        res.end(JSON.stringify(events));
      } catch (error) {
  throw error;
}
      return;
    }

    if (req.method === "GET" && req.url?.startsWith("/events/")) {
      try {
        const events = await loadEvents();
        const id = req.url.split("/")[2];

        const event = events.find((event) => event.id === id);

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
      } catch (error) {
  throw error;
}
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

        const allEvents = Array.from(eventsStore.values());

        // Filter by venue
        let filtered = allEvents;

        if (query.venue) {
          filtered = filtered.filter(
            (event) => event.venue === query.venue,
          );
        }

        // Filter by date range
        if (query.from || query.to) {
          filtered = filtered.filter((event) => {
            const eventDate = new Date(event.startsAt);

            if (query.from && eventDate < query.from) {
              return false;
            }

            if (query.to && eventDate > query.to) {
              return false;
            }

            return true;
          });
        }

        const total = filtered.length;

        // Pagination
        const start = (query.page - 1) * query.limit;

        const data = filtered.slice(
          start,
          start + query.limit,
        );

        res.writeHead(200, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            data,
            page: query.page,
            limit: query.limit,
            total,
          }),
        );
      } catch (error) {
  handleError(res, error);
}

      return;
    }

    if (handleVenueRoutes(req, res)) {
      return;
    }

    if (handleBookingRoutes(req, res, eventsStore)) {
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

initializeEventsStore();
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import type { Event } from "./domain.ts";
import { HttpError } from "./http-error.ts";
import { handleVenueRoutes } from "./venue.routes.ts";
import { handleBookingRoutes } from "./booking.routes.ts";
import { eventsQuerySchema } from "./validation.ts";

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

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(events));
      } catch (error) {
        console.error(error);

        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to load events" }));
      }

      return;
    }

    if (req.method === "GET" && req.url?.startsWith("/events/")) {
      try {
        const events = await loadEvents();
        const id = req.url.split("/")[2];
        const event = events.find((event) => event.id === id);

        if (!event) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Event not found" }));
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(event));
      } catch (error) {
        console.error(error);

        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to load events" }));
      }

      return;
    }

    // GET /v1/events with pagination and filtering
    if (req.method === "GET" && req.url?.startsWith("/v1/events")) {
      try {
        const url = new URL(req.url, "http://localhost");
        const queryParams = Object.fromEntries(url.searchParams);
        
        // Validate query params
        const query = eventsQuerySchema.parse(queryParams);
        
        const allEvents = Array.from(eventsStore.values());
        
        // Filter by venue
        let filtered = allEvents;
        if (query.venue) {
          filtered = filtered.filter((e) => e.venue === query.venue);
        }
        
        // Filter by date range (from/to on startsAt)
        if (query.from || query.to) {
          filtered = filtered.filter((e) => {
            const eventDate = new Date(e.startsAt);
            if (query.from && eventDate < query.from) return false;
            if (query.to && eventDate > query.to) return false;
            return true;
          });
        }
        
        const total = filtered.length;
        
        // Paginate
        const start = (query.page - 1) * query.limit;
        const data = filtered.slice(start, start + query.limit);
        
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            data,
            page: query.page,
            limit: query.limit,
            total,
          })
        );
      } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid query parameters" }));
        } else {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal server error" }));
        }
      }
      return;
    }

    if (handleVenueRoutes(req, res)) {
      return;
    }

    if (handleBookingRoutes(req, res, eventsStore)) {
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (error) {
    // Global error handler for unhandled errors
    console.error("Unhandled error:", error);
    
    if (error instanceof HttpError) {
      res.writeHead(error.statusCode, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  }
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

initializeEventsStore();
import { IncomingMessage, ServerResponse } from "node:http";
import { HttpError } from "./http-error.ts";
import {
  createVenue,
  listVenues,
  getVenueById,
  updateVenue,
  deleteVenue,
} from "./venue.service.ts";

export function handleVenueRoutes(
  req: IncomingMessage,
  res: ServerResponse
): boolean {
  if (!req.url?.startsWith("/v1/venues")) {
    return false;
  }

  // POST /v1/venues - create
  if (req.method === "POST" && req.url === "/v1/venues") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const { name, address, capacity, contactEmail } = data;

        if (!name || !address || capacity === undefined || !contactEmail) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ error: "Missing required fields" })
          );
          return;
        }

        if (!Number.isInteger(capacity) || capacity <= 0) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ error: "Capacity must be a positive integer" })
          );
          return;
        }

        const venue = createVenue(name, address, capacity, contactEmail);
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify(venue));
      } catch (error) {
        if (error instanceof HttpError) {
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

  // GET /v1/venues - list
  if (req.method === "GET" && req.url === "/v1/venues") {
    try {
      const limit = new URLSearchParams(req.url.split("?")[1]).get("limit");
      const venues = listVenues(limit ? parseInt(limit) : undefined);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(venues));
    } catch {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
    return true;
  }

  // GET /v1/venues/:id
  if (
    req.method === "GET" &&
    req.url?.match(/^\/v1\/venues\/[^/]+$/)
  ) {
    try {
      const id = req.url.split("/")[3]!;
      const venue = getVenueById(id);
      if (!venue) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Venue not found" }));
        return true;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(venue));
    } catch {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
    return true;
  }

  // PUT /v1/venues/:id - update
  if (req.method === "PUT" && req.url?.match(/^\/v1\/venues\/[^/]+$/)) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const id = req.url!.split("/")[3]!;
        const data = JSON.parse(body);

        if (data.capacity !== undefined) {
          if (!Number.isInteger(data.capacity) || data.capacity <= 0) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ error: "Capacity must be a positive integer" })
            );
            return;
          }
        }

        const updated = updateVenue(id, data);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(updated));
      } catch (error) {
        if (error instanceof HttpError) {
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

  // DELETE /v1/venues/:id
  if (
    req.method === "DELETE" &&
    req.url?.match(/^\/v1\/venues\/[^/]+$/)
  ) {
    try {
      const id = req.url.split("/")[3]!;
      deleteVenue(id);
      res.writeHead(204);
      res.end();
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

import { IncomingMessage, ServerResponse } from "node:http";
import { HttpError } from "./http-error.ts";
import {
  createVenue,
  listVenues,
  getVenueById,
  updateVenue,
  deleteVenue,
} from "./venue.service.ts";
import { createVenueSchema, updateVenueSchema } from "./validation.ts";
import { validate } from "./middleware.ts";
import { ZodError } from "zod";

export function handleVenueRoutes(
  req: IncomingMessage,
  res: ServerResponse,
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
        const validated = validate(data, createVenueSchema);

        const venue = createVenue(
          validated.name,
          validated.address,
          validated.capacity,
          validated.contactEmail,
        );

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify(venue));
      } catch (error) {
        if (error instanceof ZodError) {
          throw new HttpError(400, "Invalid input data");
        }

        throw error;
      }
    });

    return true;
  }
  // GET /v1/venues - list
  if (req.method === "GET" && req.url?.startsWith("/v1/venues")) {
    const url = new URL(req.url, "http://localhost:3000");
    const limitParam = url.searchParams.get("limit");

    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const venues = listVenues(limit);

    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(JSON.stringify(venues));

    return true;
  }

  // GET /v1/venues/:id
  if (req.method === "GET" && req.url?.match(/^\/v1\/venues\/[^/]+$/)) {
    const id = req.url.split("/")[3]!;
    const venue = getVenueById(id);

    if (!venue) {
      res.writeHead(404, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          error: "Venue not found",
        }),
      );

      return true;
    }

    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(JSON.stringify(venue));

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
        const validated = validate(data, updateVenueSchema);

        const updated = updateVenue(id, validated);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(updated));
      } catch (error) {
        throw error;
      }
    });
    return true;
  }

  // DELETE /v1/venues/:id
  if (req.method === "DELETE" && req.url?.match(/^\/v1\/venues\/[^/]+$/)) {
    try {
      const id = req.url.split("/")[3]!;
      deleteVenue(id);
      res.writeHead(204);
      res.end();
    } catch (error) {
      throw error;
    }
    return true;
  }

  return false;
}

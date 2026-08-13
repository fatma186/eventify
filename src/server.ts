import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import type { Event } from "./domain.ts";

async function loadEvents(): Promise<Event[]> {
  const file = await readFile("./data/events.json", "utf-8");
  return JSON.parse(file) as Event[];
}

const server = createServer(async (req, res) => {
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

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
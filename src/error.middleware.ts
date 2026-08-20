import type { ServerResponse } from "node:http";
import { HttpError } from "./http-error.ts";

export function handleError(
  res: ServerResponse,
  error: unknown,
): void {
  if (error instanceof HttpError) {
    res.writeHead(error.statusCode, {
      "Content-Type": "application/json",
    });
    res.end(
      JSON.stringify({
        error: error.message,
        details: {},
      }),
    );
    return;
  }

  res.writeHead(500, {
    "Content-Type": "application/json",
  });
  res.end(
    JSON.stringify({
      error: "Internal server error",
      details: {},
    }),
  );
}
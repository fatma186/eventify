import type { IncomingMessage, ServerResponse } from "node:http";
import type { ZodType } from "zod";
import { HttpError } from "./http-error.ts";

export function validateQuery<T>(
  req: IncomingMessage,
  res: ServerResponse,
  schema: ZodType<T>,
): T {
  const url = new URL(req.url ?? "", "http://localhost");
  const queryParams = Object.fromEntries(url.searchParams);

  const result = schema.safeParse(queryParams);

  if (!result.success) {
  throw new HttpError(400, "Invalid query parameters");
  }

  return result.data;
}
export function validate<T>(
  data: unknown,
  schema: ZodType<T>,
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new HttpError(400, "Invalid request body");
  }

  return result.data;
}
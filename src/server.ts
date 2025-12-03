import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { pinoLoggerMiddleware } from "#/shared/infrastructure/middlewares/logger.middleware.ts";

const app = new Hono();

// Before request middlewares
app
  .use(logger(pinoLoggerMiddleware))
  .use(secureHeaders());

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

Deno.serve(app.fetch);

/**
 * Application Entry Point
 *
 * Sets up the Hono server with middleware and routes.
 * Feature modules are self-contained and handle their own initialization.
 */

import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { pinoLoggerMiddleware } from "#/shared/infrastructure/middlewares/logger.middleware.ts";

// Feature routes (import order matters for cross-feature dependencies)
import { authRoutes } from "#/features/auth/index.ts";
import { inventoryRoutes } from "#/features/inventories/index.ts";
import { itemRoutes } from "#/features/items/index.ts";

const app = new Hono();

// Middlewares
app
  .use(logger(pinoLoggerMiddleware))
  .use(secureHeaders());

app.get("/", (c) => c.text("Hello Hono!"));

// Mount feature routes
app.route("/auth", authRoutes);
app.route("/inventory", inventoryRoutes);
app.route("/items", itemRoutes);

Deno.serve(app.fetch);

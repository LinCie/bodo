/**
 * Application Entry Point
 *
 * Sets up the Hono server with middleware and routes.
 * Configures dependency injection for all feature modules.
 */

import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { pinoLoggerMiddleware } from "#/shared/infrastructure/middlewares/logger.middleware.ts";
import { getDatabase } from "#/shared/infrastructure/persistence/index.ts";

// Items module imports
import { createItemRoutes } from "#/features/items/presentation/item.routes.ts";
import { ItemRepository } from "#/features/items/infrastructure/item.repository.ts";
import { ItemAIService } from "#/features/items/infrastructure/item.ai-service.ts";

// Inventories module imports
import { createInventoryRoutes } from "#/features/inventories/presentation/inventory.routes.ts";
import { InventoryRepository } from "#/features/inventories/infrastructure/inventory.repository.ts";
import { InventoryService } from "#/features/inventories/infrastructure/inventory.service.ts";
import { SpaceLookupService } from "#/features/inventories/infrastructure/space-lookup.service.ts";

const app = new Hono();

// Before request middlewares
app
  .use(logger(pinoLoggerMiddleware))
  .use(secureHeaders());

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// Initialize database and dependencies
// Cast to unknown to satisfy repository constructor types
// deno-lint-ignore no-explicit-any
const db = getDatabase() as any;

// Initialize repositories
const itemRepository = new ItemRepository(db);
const inventoryRepository = new InventoryRepository(db);

// Initialize services
const spaceLookupService = new SpaceLookupService(db);
const inventoryService = new InventoryService(
  inventoryRepository,
  spaceLookupService,
);

// Initialize AI service (optional - requires GEMINI_API_KEY)
const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
const itemAIService = geminiApiKey
  ? new ItemAIService(itemRepository, geminiApiKey)
  : undefined;

// Register items routes at /items
// @requirements 8.4
const itemRoutes = createItemRoutes({
  itemRepository,
  inventoryService,
  itemAIService,
});
app.route("/items", itemRoutes);

// Register inventory routes at /inventory
// @requirements 8.4
const inventoryRoutes = createInventoryRoutes({
  inventoryService,
});
app.route("/inventory", inventoryRoutes);

Deno.serve(app.fetch);

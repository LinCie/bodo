/**
 * Items Feature Module
 *
 * Self-contained module that initializes its own dependencies
 * and exports routes ready for mounting.
 */

import { getDatabase } from "#/shared/infrastructure/persistence/index.ts";
import {
  resolveService,
  ServiceKeys,
} from "#/shared/infrastructure/services/index.ts";
import type { IInventoryService } from "#/shared/domain/interfaces/inventory-service.interface.ts";
import { ItemRepository } from "./infrastructure/item.repository.ts";
import { ItemAIService } from "./infrastructure/item.ai-service.ts";
import { createItemRoutes } from "./presentation/item.routes.ts";

// Initialize module dependencies
const db = getDatabase();
const itemRepository = new ItemRepository(db);

// Resolve cross-feature dependency
const inventoryService = resolveService<IInventoryService>(
  ServiceKeys.INVENTORY_SERVICE,
);

// Initialize AI service (optional)
const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
const itemAIService = geminiApiKey
  ? new ItemAIService(itemRepository, geminiApiKey)
  : undefined;

// Export routes for mounting
export const itemRoutes = createItemRoutes({
  itemRepository,
  inventoryService,
  itemAIService,
});

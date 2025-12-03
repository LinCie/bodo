/**
 * Inventories Feature Module
 *
 * Self-contained module that initializes its own dependencies
 * and exports routes ready for mounting.
 */

import { getDatabase } from "#/shared/infrastructure/persistence/index.ts";
import {
  registerService,
  ServiceKeys,
} from "#/shared/infrastructure/services/index.ts";
import { InventoryRepository } from "./infrastructure/inventory.repository.ts";
import { InventoryService } from "./infrastructure/inventory.service.ts";
import { SpaceLookupService } from "./infrastructure/space-lookup.service.ts";
import { createInventoryRoutes } from "./presentation/inventory.routes.ts";

// Initialize module dependencies
const db = getDatabase();
const inventoryRepository = new InventoryRepository(db);
const spaceLookupService = new SpaceLookupService(db);
const inventoryService = new InventoryService(
  inventoryRepository,
  spaceLookupService,
);

// Register shared service for cross-feature access
registerService(ServiceKeys.INVENTORY_SERVICE, inventoryService);

// Export routes for mounting
export const inventoryRoutes = createInventoryRoutes({ inventoryService });

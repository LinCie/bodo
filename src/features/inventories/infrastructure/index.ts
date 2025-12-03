/**
 * Inventory Infrastructure Layer Exports
 *
 * Re-exports all infrastructure components for the inventory feature.
 */

export {
  type CreateInventoryBatchData,
  InventoryRepository,
} from "./inventory.repository.ts";

export { SpaceLookupService } from "./space-lookup.service.ts";

export { InventoryService } from "./inventory.service.ts";

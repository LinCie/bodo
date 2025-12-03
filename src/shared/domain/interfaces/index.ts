/**
 * Shared domain interfaces for cross-slice communication.
 */

export type {
  IInventoryService,
  InventoryRecord,
  ItemForPropagation,
  PropagationResult,
} from "./inventory-service.interface.ts";

export type { ISpaceLookup, SpaceInfo } from "./space-lookup.interface.ts";

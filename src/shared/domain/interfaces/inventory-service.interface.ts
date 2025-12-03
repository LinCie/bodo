/**
 * Interface for inventory service cross-slice communication.
 * Used by the items slice to trigger inventory propagation without
 * directly importing from the inventory slice.
 */

import type { Result } from "../result.ts";
import type { DomainError } from "../errors.ts";

/**
 * Data required for propagating an item to child spaces.
 */
export interface ItemForPropagation {
  readonly id: number;
  readonly name: string;
  readonly code: string | null;
  readonly sku: string | null;
  readonly cost: string | null;
  readonly status: string;
  readonly notes: string | null;
  readonly spaceId: number | null;
  readonly spaceType: string | null;
}

/**
 * Inventory record returned from findByItemId.
 */
export interface InventoryRecord {
  readonly id: number;
  readonly itemId: number;
  readonly spaceId: number;
  readonly balance: string;
  readonly notes: string | null;
  readonly status: string | null;
  readonly costPerUnit: string | null;
}

/**
 * Result of inventory propagation operation.
 */
export interface PropagationResult {
  readonly updatedCount: number;
}

/**
 * Interface for inventory service operations.
 * Enables cross-slice communication between items and inventory slices.
 */
export interface IInventoryService {
  /**
   * Propagates inventory records to all child spaces of the item's space.
   * Creates inventory records in spaces that don't already have one.
   *
   * @param item - The item data to propagate
   * @returns Result with count of newly created inventory records
   */
  propagateToChildSpaces(
    item: ItemForPropagation,
  ): Promise<Result<PropagationResult, DomainError>>;

  /**
   * Finds all inventory records for a given item.
   *
   * @param itemId - The ID of the item
   * @returns Result with array of inventory records
   */
  findByItemId(itemId: number): Promise<Result<InventoryRecord[], DomainError>>;
}

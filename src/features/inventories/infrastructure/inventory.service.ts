/**
 * Inventory Service Implementation
 *
 * Implements IInventoryService interface for cross-slice communication.
 * Handles inventory propagation to child spaces and inventory queries.
 *
 * @requirements 6.1-6.6
 */

import type { DomainError } from "#/shared/domain/errors.ts";
import { Result } from "#/shared/domain/result.ts";
import type {
  IInventoryService,
  InventoryRecord,
  ItemForPropagation,
  PropagationResult,
} from "#/shared/domain/interfaces/inventory-service.interface.ts";
import type { ISpaceLookup } from "#/shared/domain/interfaces/space-lookup.interface.ts";
import type {
  CreateInventoryBatchData,
  InventoryRepository,
} from "./inventory.repository.ts";

/**
 * Inventory service implementing IInventoryService interface.
 * Coordinates between space lookup and inventory repository for propagation.
 */
export class InventoryService implements IInventoryService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly spaceLookup: ISpaceLookup,
  ) {}

  /**
   * Propagates inventory records to all child spaces of the item's space.
   * Creates inventory records in spaces that don't already have one.
   *
   * @param item - The item data to propagate
   * @returns Result with count of newly created inventory records
   * @requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
   */
  async propagateToChildSpaces(
    item: ItemForPropagation,
  ): Promise<Result<PropagationResult, DomainError>> {
    // If item has no space assigned, return zero count
    // @requirements 6.3
    if (!item.spaceId) {
      return Result.ok({ updatedCount: 0 });
    }

    // Get all child spaces in the hierarchy using recursive CTE
    // @requirements 6.1
    const childrenResult = await this.spaceLookup.findChildrenIds(item.spaceId);
    if (childrenResult.isErr()) {
      return childrenResult;
    }

    const childrenIds = childrenResult.value;
    if (childrenIds.length === 0) {
      return Result.ok({ updatedCount: 0 });
    }

    // Check which child spaces already have inventory for this item
    // @requirements 6.2
    const existingResult = await this.inventoryRepository.findExistingSpaceIds(
      item.id,
      childrenIds,
    );
    if (existingResult.isErr()) {
      return existingResult;
    }

    const existingSpaceIds = existingResult.value;

    // Prepare new inventory records for spaces that don't have one yet
    // @requirements 6.5, 6.6
    const newInventories: CreateInventoryBatchData[] = [];

    for (const spaceId of childrenIds) {
      if (!existingSpaceIds.has(spaceId)) {
        newInventories.push({
          itemId: item.id,
          itemType: "ITM", // @requirements 6.6
          spaceId: spaceId,
          spaceType: item.spaceType ?? "SPACE",
          name: item.name,
          code: item.code,
          sku: item.sku,
          costPerUnit: item.cost, // @requirements 6.5 - cost maps to cost_per_unit
          status: item.status,
          notes: item.notes,
          modelType: "SUP", // @requirements 6.6
          parentType: "IVT", // @requirements 6.6
        });
      }
    }

    // Bulk insert new inventories
    if (newInventories.length === 0) {
      return Result.ok({ updatedCount: 0 });
    }

    const createResult = await this.inventoryRepository.createBatch(
      newInventories,
    );
    if (createResult.isErr()) {
      return createResult;
    }

    // @requirements 6.4 - return count of newly created records
    return Result.ok({ updatedCount: createResult.value });
  }

  /**
   * Finds all inventory records for a given item.
   *
   * @param itemId - The ID of the item
   * @returns Result with array of inventory records
   */
  async findByItemId(
    itemId: number,
  ): Promise<Result<InventoryRecord[], DomainError>> {
    const result = await this.inventoryRepository.findByItemId(itemId);
    if (result.isErr()) {
      return result;
    }

    // Map Inventory entities to InventoryRecord interface
    const records: InventoryRecord[] = result.value.map((inv) => ({
      id: inv.id,
      itemId: inv.itemId,
      spaceId: inv.spaceId,
      balance: inv.balance,
      notes: inv.notes,
      status: inv.status,
      costPerUnit: inv.costPerUnit,
    }));

    return Result.ok(records);
  }
}

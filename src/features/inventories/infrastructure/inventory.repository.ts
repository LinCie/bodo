/**
 * Inventory Repository Implementation
 *
 * Implements data access for Inventory entity with Kysely for type-safe SQL queries.
 * Handles finding inventories by item, checking existing records, and batch creation.
 *
 * @requirements 6.1, 6.2, 6.5, 6.6
 */

import type { Insertable, Kysely, Selectable } from "kysely";
import type { DomainError } from "#/shared/domain/errors.ts";
import { DatabaseError } from "#/shared/domain/errors.ts";
import { Result } from "#/shared/domain/result.ts";
import {
  Inventory,
  type InventoryProps,
} from "#/features/inventories/domain/inventory.entity.ts";
import { mapRowToEntity } from "#/shared/infrastructure/mappers/index.ts";
import type {
  DB,
  Inventories,
} from "#/shared/infrastructure/persistence/generated.ts";

/**
 * Database row type for inventories table (from generated types).
 */
type InventoryRow = Selectable<Inventories>;

/**
 * Data for creating inventory records in batch.
 */
export interface CreateInventoryBatchData {
  itemId: number;
  itemType: string;
  spaceId: number;
  spaceType: string;
  name: string | null;
  code: string | null;
  sku: string | null;
  costPerUnit: string | null;
  status: string | null;
  notes: string | null;
  modelType: string | null;
  parentType: string | null;
}

/**
 * Maps a database row to an Inventory entity.
 * @param row - Database row with snake_case keys
 * @returns Inventory entity instance
 */
function rowToInventory(row: InventoryRow): Inventory {
  const mapped = mapRowToEntity<InventoryProps>(
    row as unknown as Record<string, unknown>,
  );
  return new Inventory(mapped);
}

/**
 * Inventory repository for data access operations.
 * Uses Kysely for type-safe SQL queries with Result type for error handling.
 */
export class InventoryRepository {
  private readonly db: Kysely<DB>;

  constructor(db: Kysely<DB>) {
    this.db = db;
  }

  /**
   * Find all inventories for a given item.
   *
   * @param itemId - The ID of the item
   * @returns Result containing array of inventories or an error
   * @requirements 6.1
   */
  async findByItemId(
    itemId: number,
  ): Promise<Result<Inventory[], DomainError>> {
    try {
      const rows = await this.db
        .selectFrom("inventories")
        .selectAll()
        .where("item_id", "=", itemId)
        .execute();

      const inventories = rows.map((row) => rowToInventory(row));
      return Result.ok(inventories);
    } catch (error) {
      return Result.err(
        new DatabaseError(
          `Failed to find inventories for item: ${itemId}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Find inventory record by space and item combination.
   * Used to check if an inventory record already exists.
   *
   * @param spaceId - The ID of the space
   * @param itemId - The ID of the item
   * @returns Result containing inventory if found, null otherwise
   * @requirements 6.2
   */
  async findBySpaceAndItem(
    spaceId: number,
    itemId: number,
  ): Promise<Result<Inventory | null, DomainError>> {
    try {
      const row = await this.db
        .selectFrom("inventories")
        .selectAll()
        .where("space_id", "=", spaceId)
        .where("item_id", "=", itemId)
        .executeTakeFirst();

      if (!row) {
        return Result.ok(null);
      }

      return Result.ok(rowToInventory(row));
    } catch (error) {
      return Result.err(
        new DatabaseError(
          `Failed to find inventory for space ${spaceId} and item ${itemId}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Find existing inventory space IDs for a given item within specified spaces.
   * Used to determine which spaces already have inventory records.
   *
   * @param itemId - The ID of the item
   * @param spaceIds - Array of space IDs to check
   * @returns Result containing set of space IDs that have inventory records
   * @requirements 6.2
   */
  async findExistingSpaceIds(
    itemId: number,
    spaceIds: number[],
  ): Promise<Result<Set<number>, DomainError>> {
    try {
      if (spaceIds.length === 0) {
        return Result.ok(new Set<number>());
      }

      const rows = await this.db
        .selectFrom("inventories")
        .select("space_id")
        .where("item_id", "=", itemId)
        .where("space_id", "in", spaceIds)
        .execute();

      const existingSpaceIds = new Set(
        rows
          .map((r) => r.space_id)
          .filter((id): id is number => id !== null),
      );
      return Result.ok(existingSpaceIds);
    } catch (error) {
      return Result.err(
        new DatabaseError(
          `Failed to find existing inventory space IDs for item: ${itemId}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Create multiple inventory records in batch.
   * Used during inventory propagation to child spaces.
   *
   * @param inventories - Array of inventory data to create
   * @returns Result containing count of created records or an error
   * @requirements 6.1, 6.5, 6.6
   */
  async createBatch(
    inventories: CreateInventoryBatchData[],
  ): Promise<Result<number, DomainError>> {
    try {
      if (inventories.length === 0) {
        return Result.ok(0);
      }

      const now = new Date();
      const rows: Insertable<Inventories>[] = inventories.map((inv) => ({
        item_id: inv.itemId,
        item_type: inv.itemType,
        space_id: inv.spaceId,
        space_type: inv.spaceType,
        name: inv.name,
        code: inv.code,
        sku: inv.sku,
        balance: "0",
        cost_per_unit: inv.costPerUnit ?? "0",
        status: inv.status ?? undefined,
        notes: inv.notes,
        model_type: inv.modelType,
        parent_type: inv.parentType,
        created_at: now,
        updated_at: now,
      }));

      await this.db.insertInto("inventories").values(rows).execute();

      return Result.ok(inventories.length);
    } catch (error) {
      return Result.err(
        new DatabaseError(
          "Failed to create inventory records in batch",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }
}

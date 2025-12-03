/**
 * Item Repository Implementation
 *
 * Implements BaseRepository for Item entity with Kysely for type-safe SQL queries.
 * Handles CRUD operations, filtering, pagination, sorting, and space hierarchy queries.
 *
 * @requirements 8.2, 1.1, 1.4, 1.5, 2.1-2.9, 3.1-3.3, 4.1-4.3, 5.1-5.4
 */

import type { Insertable, Kysely, Selectable } from "kysely";
import type { BaseRepository } from "#/shared/domain/repository.ts";
import type { DomainError } from "#/shared/domain/errors.ts";
import { DatabaseError } from "#/shared/domain/errors.ts";
import { Result } from "#/shared/domain/result.ts";
import { Item, type ItemStatus } from "#/features/items/domain/item.entity.ts";
import { ItemNotFoundError } from "#/features/items/domain/item.errors.ts";
import type {
  CreateItemDTO,
  FindAllQuery,
  UpdateItemDTO,
} from "#/features/items/application/item.dtos.ts";
import { mapRowToEntity } from "#/shared/infrastructure/mappers/index.ts";
import type {
  DB,
  Items,
} from "#/shared/infrastructure/persistence/generated.ts";

/**
 * Database row type for items table (from generated types).
 */
type ItemRow = Selectable<Items>;

/**
 * Commerce fields subset for type=commerce queries.
 * @requirements 2.6
 */
const COMMERCE_FIELDS = [
  "id",
  "name",
  "description",
  "price",
  "weight",
  "images",
] as const;

/**
 * Maps a database row to an Item entity.
 * @param row - Database row with snake_case keys
 * @returns Item entity instance
 */
function rowToItem(row: ItemRow): Item {
  const mapped = mapRowToEntity<{
    id: number;
    name: string;
    code: string | null;
    sku: string | null;
    primaryCode: string | null;
    description: string | null;
    notes: string | null;
    price: string | null;
    cost: string | null;
    weight: string | null;
    status: ItemStatus;
    spaceId: number | null;
    spaceType: string | null;
    parentId: number | null;
    parentType: string | null;
    modelId: number | null;
    modelType: string | null;
    typeId: number | null;
    typeType: string | null;
    images: unknown | null;
    files: unknown | null;
    links: unknown | null;
    tags: unknown | null;
    attributes: unknown | null;
    options: unknown | null;
    variants: unknown | null;
    dimension: unknown | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }>(row as unknown as Record<string, unknown>);

  return new Item(mapped);
}

/**
 * Item repository implementing BaseRepository interface.
 * Uses Kysely for type-safe SQL queries with Result type for error handling.
 */
export class ItemRepository
  implements BaseRepository<Item, CreateItemDTO, UpdateItemDTO> {
  private readonly db: Kysely<DB>;

  constructor(db: Kysely<DB>) {
    this.db = db;
  }

  /**
   * Find an item by its unique identifier.
   * Returns NotFoundError for non-existent or soft-deleted items.
   *
   * @param id - The item's unique identifier
   * @returns Result containing the item if found, null if not found, or an error
   * @requirements 3.1, 3.2, 3.3
   */
  async findById(id: number): Promise<Result<Item | null, DomainError>> {
    try {
      const row = await this.db
        .selectFrom("items")
        .selectAll()
        .where("id", "=", id)
        .where("deleted_at", "is", null)
        .executeTakeFirst();

      if (!row) {
        return Result.ok(null);
      }

      return Result.ok(rowToItem(row));
    } catch (error) {
      return Result.err(
        new DatabaseError(
          `Failed to find item by id: ${id}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Find all non-deleted items.
   * For filtered queries, use findAllWithQuery instead.
   *
   * @returns Result containing an array of items or an error
   */
  async findAll(): Promise<Result<Item[], DomainError>> {
    try {
      const rows = await this.db
        .selectFrom("items")
        .selectAll()
        .where("deleted_at", "is", null)
        .where("status", "=", "active")
        .execute();

      const items = rows.map((row) => rowToItem(row));
      return Result.ok(items);
    } catch (error) {
      return Result.err(
        new DatabaseError(
          "Failed to find all items",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Find items with filtering, pagination, sorting, and space hierarchy.
   * Includes items from the specified space and its parent space.
   *
   * @param query - Query parameters for filtering and pagination
   * @returns Result containing filtered items or an error
   * @requirements 2.1-2.9
   */
  async findAllWithQuery(
    query: FindAllQuery,
  ): Promise<Result<Item[], DomainError>> {
    try {
      const {
        spaceId,
        page = 1,
        limit = 10,
        search,
        status = "active",
        sortBy = "id",
        sortOrder = "asc",
        type = "dashboard",
      } = query;

      // Get space and its parent to include items from parent space
      // @requirements 2.1
      const space = await this.db
        .selectFrom("spaces")
        .select("parent_id")
        .where("id", "=", spaceId)
        .executeTakeFirst();

      const spaceIds: number[] = [spaceId];
      if (space?.parent_id) {
        spaceIds.push(space.parent_id);
      }

      // Map sortBy from camelCase to snake_case for database
      const sortByColumn = sortBy === "createdAt"
        ? "created_at"
        : (sortBy as "id" | "name" | "price");

      // Build base query
      let baseQuery = this.db
        .selectFrom("items")
        .where("space_id", "in", spaceIds)
        .where("status", "=", status)
        .orderBy(sortByColumn, sortOrder)
        .limit(limit)
        .offset((page - 1) * limit);

      // Apply search filter if provided
      // @requirements 2.3
      if (search) {
        baseQuery = baseQuery.where((eb) =>
          eb.or([
            eb("name", "like", `%${search}%`),
            eb("code", "like", `%${search}%`),
            eb("sku", "like", `%${search}%`),
            eb("notes", "like", `%${search}%`),
          ])
        );
      }

      // Select columns based on type (commerce vs dashboard)
      // @requirements 2.6, 2.7
      let rows: ItemRow[];
      if (type === "commerce") {
        const commerceRows = await baseQuery
          .select(COMMERCE_FIELDS as unknown as (keyof ItemRow)[])
          .execute();
        // For commerce type, we return partial data - create items with defaults
        rows = commerceRows.map((row) => ({
          ...row,
          code: null,
          sku: null,
          primary_code: null,
          notes: null,
          cost: "0",
          status: "active",
          space_id: null,
          space_type: null,
          parent_id: null,
          parent_type: null,
          model_id: null,
          model_type: null,
          type_id: null,
          type_type: null,
          files: null,
          links: null,
          tags: null,
          attributes: null,
          options: null,
          variants: null,
          dimension: null,
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
        })) as unknown as ItemRow[];
      } else {
        rows = await baseQuery.selectAll().execute();
      }

      const items = rows.map((row) => rowToItem(row));
      return Result.ok(items);
    } catch (error) {
      return Result.err(
        new DatabaseError(
          "Failed to find items with query",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Create a new item.
   * Sets createdAt and updatedAt timestamps, deletedAt to null.
   *
   * @param data - The data for creating the item
   * @returns Result containing the created item or an error
   * @requirements 1.1, 1.4, 1.5
   */
  async create(data: CreateItemDTO): Promise<Result<Item, DomainError>> {
    try {
      const now = new Date();

      const insertData: Insertable<Items> = {
        name: data.name,
        code: data.code ?? null,
        sku: data.sku ?? null,
        primary_code: data.primaryCode ?? null,
        description: data.description ?? null,
        notes: data.notes ?? null,
        price: data.price ?? "0",
        cost: data.cost ?? "0",
        weight: data.weight ?? "0",
        status: data.status ?? "active",
        space_id: data.spaceId ?? null,
        space_type: data.spaceType ?? null,
        parent_id: data.parentId ?? null,
        parent_type: data.parentType ?? null,
        model_id: data.modelId ?? null,
        model_type: data.modelType ?? null,
        type_id: data.typeId ?? null,
        type_type: data.typeType ?? null,
        images: data.images ? JSON.stringify(data.images) : null,
        files: data.files ? JSON.stringify(data.files) : null,
        links: data.links ? JSON.stringify(data.links) : null,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        attributes: data.attributes ? JSON.stringify(data.attributes) : null,
        options: data.options ? JSON.stringify(data.options) : null,
        variants: data.variants ? JSON.stringify(data.variants) : null,
        dimension: data.dimension ? JSON.stringify(data.dimension) : null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };

      const result = await this.db
        .insertInto("items")
        .values(insertData)
        .executeTakeFirstOrThrow();

      const insertedId = Number(result.insertId);

      // Fetch the created item
      const row = await this.db
        .selectFrom("items")
        .selectAll()
        .where("id", "=", insertedId)
        .executeTakeFirst();

      if (!row) {
        return Result.err(new DatabaseError("Failed to retrieve created item"));
      }

      return Result.ok(rowToItem(row));
    } catch (error) {
      return Result.err(
        new DatabaseError(
          "Failed to create item",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Update an existing item.
   * Sets updatedAt timestamp to current time.
   *
   * @param id - The item's unique identifier
   * @param data - The partial data for updating the item
   * @returns Result containing the updated item or an error
   * @requirements 4.1, 4.2, 4.3
   */
  async update(
    id: number,
    data: UpdateItemDTO,
  ): Promise<Result<Item, DomainError>> {
    try {
      // First check if item exists and is not deleted
      const existing = await this.db
        .selectFrom("items")
        .selectAll()
        .where("id", "=", id)
        .where("deleted_at", "is", null)
        .executeTakeFirst();

      if (!existing) {
        return Result.err(new ItemNotFoundError(id));
      }

      const now = new Date();

      // Build update object with snake_case keys
      const updateData: Record<string, unknown> = {
        updated_at: now,
      };

      // Map camelCase DTO fields to snake_case database columns
      if (data.name !== undefined) updateData.name = data.name;
      if (data.code !== undefined) updateData.code = data.code;
      if (data.sku !== undefined) updateData.sku = data.sku;
      if (data.primaryCode !== undefined) {
        updateData.primary_code = data.primaryCode;
      }
      if (data.description !== undefined) {
        updateData.description = data.description;
      }
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.cost !== undefined) updateData.cost = data.cost;
      if (data.weight !== undefined) updateData.weight = data.weight;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.spaceId !== undefined) updateData.space_id = data.spaceId;
      if (data.spaceType !== undefined) updateData.space_type = data.spaceType;
      if (data.parentId !== undefined) updateData.parent_id = data.parentId;
      if (data.parentType !== undefined) {
        updateData.parent_type = data.parentType;
      }
      if (data.modelId !== undefined) updateData.model_id = data.modelId;
      if (data.modelType !== undefined) updateData.model_type = data.modelType;
      if (data.typeId !== undefined) updateData.type_id = data.typeId;
      if (data.typeType !== undefined) updateData.type_type = data.typeType;
      if (data.images !== undefined) {
        updateData.images = data.images ? JSON.stringify(data.images) : null;
      }
      if (data.files !== undefined) {
        updateData.files = data.files ? JSON.stringify(data.files) : null;
      }
      if (data.links !== undefined) {
        updateData.links = data.links ? JSON.stringify(data.links) : null;
      }
      if (data.tags !== undefined) {
        updateData.tags = data.tags ? JSON.stringify(data.tags) : null;
      }
      if (data.attributes !== undefined) {
        updateData.attributes = data.attributes
          ? JSON.stringify(data.attributes)
          : null;
      }
      if (data.options !== undefined) {
        updateData.options = data.options ? JSON.stringify(data.options) : null;
      }
      if (data.variants !== undefined) {
        updateData.variants = data.variants
          ? JSON.stringify(data.variants)
          : null;
      }
      if (data.dimension !== undefined) {
        updateData.dimension = data.dimension
          ? JSON.stringify(data.dimension)
          : null;
      }

      await this.db
        .updateTable("items")
        .set(updateData)
        .where("id", "=", id)
        .execute();

      // Fetch and return the updated item
      const updated = await this.db
        .selectFrom("items")
        .selectAll()
        .where("id", "=", id)
        .executeTakeFirst();

      if (!updated) {
        return Result.err(new ItemNotFoundError(id));
      }

      return Result.ok(rowToItem(updated));
    } catch (error) {
      return Result.err(
        new DatabaseError(
          `Failed to update item: ${id}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Soft delete an item by setting deletedAt timestamp and status to archived.
   * Preserves all item data for audit purposes.
   *
   * @param id - The item's unique identifier
   * @returns Result containing true if deleted successfully, or an error
   * @requirements 5.1, 5.2, 5.3, 5.4
   */
  async delete(id: number): Promise<Result<boolean, DomainError>> {
    try {
      // First check if item exists and is not already deleted
      const existing = await this.db
        .selectFrom("items")
        .select("id")
        .where("id", "=", id)
        .where("deleted_at", "is", null)
        .executeTakeFirst();

      if (!existing) {
        return Result.err(new ItemNotFoundError(id));
      }

      const now = new Date();

      await this.db
        .updateTable("items")
        .set({
          deleted_at: now,
          status: "archived",
        })
        .where("id", "=", id)
        .execute();

      return Result.ok(true);
    } catch (error) {
      return Result.err(
        new DatabaseError(
          `Failed to delete item: ${id}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Find an item by ID including soft-deleted items.
   * Used internally for operations that need to access archived items.
   *
   * @param id - The item's unique identifier
   * @returns Result containing the item if found, or an error
   */
  async findByIdIncludingDeleted(
    id: number,
  ): Promise<Result<Item | null, DomainError>> {
    try {
      const row = await this.db
        .selectFrom("items")
        .selectAll()
        .where("id", "=", id)
        .executeTakeFirst();

      if (!row) {
        return Result.ok(null);
      }

      return Result.ok(rowToItem(row));
    } catch (error) {
      return Result.err(
        new DatabaseError(
          `Failed to find item by id: ${id}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }
}

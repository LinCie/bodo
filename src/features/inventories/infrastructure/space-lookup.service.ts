/**
 * Space Lookup Service Implementation
 *
 * Implements ISpaceLookup interface for space hierarchy queries.
 * Uses recursive CTE to traverse the space hierarchy.
 *
 * @requirements 2.1, 6.1
 */

import type { Kysely } from "kysely";
import type { DomainError } from "#/shared/domain/errors.ts";
import { DatabaseError } from "#/shared/domain/errors.ts";
import { Result } from "#/shared/domain/result.ts";
import type {
  ISpaceLookup,
  SpaceInfo,
} from "#/shared/domain/interfaces/space-lookup.interface.ts";
import { mapRowToEntity } from "#/shared/infrastructure/mappers/index.ts";
import type { DB } from "#/shared/infrastructure/persistence/generated.ts";

/**
 * Space lookup service implementing ISpaceLookup interface.
 * Provides space hierarchy queries using recursive CTEs.
 */
export class SpaceLookupService implements ISpaceLookup {
  private readonly db: Kysely<DB>;

  constructor(db: Kysely<DB>) {
    this.db = db;
  }

  /**
   * Finds a space by its ID.
   *
   * @param id - The ID of the space to find
   * @returns Result with space info or null if not found
   * @requirements 2.1
   */
  async findById(id: number): Promise<Result<SpaceInfo | null, DomainError>> {
    try {
      const row = await this.db
        .selectFrom("spaces")
        .select(["id", "name", "parent_id"])
        .where("id", "=", id)
        .executeTakeFirst();

      if (!row) {
        return Result.ok(null);
      }

      const mapped = mapRowToEntity<SpaceInfo>(
        row as unknown as Record<string, unknown>,
      );
      return Result.ok(mapped);
    } catch (error) {
      return Result.err(
        new DatabaseError(
          `Failed to find space by id: ${id}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Finds all child space IDs for a given parent space.
   * Uses recursive CTE to traverse the entire hierarchy.
   *
   * @param spaceId - The ID of the parent space
   * @returns Result with array of child space IDs
   * @requirements 6.1
   */
  async findChildrenIds(
    spaceId: number,
  ): Promise<Result<number[], DomainError>> {
    try {
      // Use recursive CTE to find all descendant spaces
      // The CTE starts with the given space and recursively joins
      // to find all spaces where parent_id matches a space in the tree
      const result = await this.db
        .withRecursive("space_tree", (db) =>
          db
            .selectFrom("spaces")
            .select("id")
            .where("id", "=", spaceId)
            .unionAll(
              db
                .selectFrom("spaces")
                .select("spaces.id")
                .innerJoin("space_tree", "space_tree.id", "spaces.parent_id"),
            ))
        .selectFrom("space_tree")
        .select("id")
        .where("id", "!=", spaceId) // Exclude the parent space itself
        .execute();

      const childIds = result.map((r) => r.id);
      return Result.ok(childIds);
    } catch (error) {
      return Result.err(
        new DatabaseError(
          `Failed to find children for space: ${spaceId}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }
}

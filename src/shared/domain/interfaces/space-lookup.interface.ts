/**
 * Interface for space lookup cross-slice communication.
 * Used for querying space hierarchy information without
 * directly importing from a spaces slice.
 */

import type { Result } from "../result.ts";
import type { DomainError } from "../errors.ts";

/**
 * Basic space information returned from lookup operations.
 */
export interface SpaceInfo {
  readonly id: number;
  readonly name: string;
  readonly parentId: number | null;
  readonly spaceType: string | null;
}

/**
 * Interface for space lookup operations.
 * Enables cross-slice communication for space hierarchy queries.
 */
export interface ISpaceLookup {
  /**
   * Finds a space by its ID.
   *
   * @param id - The ID of the space to find
   * @returns Result with space info or null if not found
   */
  findById(id: number): Promise<Result<SpaceInfo | null, DomainError>>;

  /**
   * Finds all child space IDs for a given parent space.
   * Uses recursive CTE to traverse the entire hierarchy.
   *
   * @param spaceId - The ID of the parent space
   * @returns Result with array of child space IDs
   */
  findChildrenIds(spaceId: number): Promise<Result<number[], DomainError>>;
}

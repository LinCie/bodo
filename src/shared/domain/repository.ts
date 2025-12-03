/**
 * Base repository interface defining standard CRUD operations.
 * All repositories should implement this interface for consistent data access patterns.
 */

import type { BaseEntity } from "./entity.ts";
import type { DomainError } from "./errors.ts";
import type { Result } from "./result.ts";

/**
 * Generic repository interface for CRUD operations.
 *
 * @typeParam T - The entity type extending BaseEntity
 * @typeParam CreateDTO - Data transfer object for creating entities
 * @typeParam UpdateDTO - Data transfer object for updating entities
 */
export interface BaseRepository<
  T extends BaseEntity,
  CreateDTO,
  UpdateDTO,
> {
  /**
   * Find an entity by its unique identifier.
   * @param id - The entity's unique identifier
   * @returns Result containing the entity if found, null if not found, or an error
   */
  findById(id: number): Promise<Result<T | null, DomainError>>;

  /**
   * Find all non-deleted entities.
   * @returns Result containing an array of entities or an error
   */
  findAll(): Promise<Result<T[], DomainError>>;

  /**
   * Create a new entity.
   * @param data - The data for creating the entity
   * @returns Result containing the created entity or an error
   */
  create(data: CreateDTO): Promise<Result<T, DomainError>>;

  /**
   * Update an existing entity.
   * @param id - The entity's unique identifier
   * @param data - The partial data for updating the entity
   * @returns Result containing the updated entity or an error
   */
  update(id: number, data: UpdateDTO): Promise<Result<T, DomainError>>;

  /**
   * Soft delete an entity by setting the deletedAt timestamp.
   * @param id - The entity's unique identifier
   * @returns Result containing true if deleted successfully, or an error
   */
  delete(id: number): Promise<Result<boolean, DomainError>>;
}

/**
 * Item-specific domain errors.
 * Extends shared domain errors for item-related error handling.
 */

import { NotFoundError } from "#/shared/domain/errors.ts";

/**
 * Error thrown when an item is not found by ID.
 * Used for get, update, and delete operations on non-existent items.
 */
export class ItemNotFoundError extends NotFoundError {
  constructor(id: number) {
    super("Item", id);
  }
}

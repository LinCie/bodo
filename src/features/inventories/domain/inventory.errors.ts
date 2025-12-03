/**
 * Inventory-specific domain errors.
 * Extends shared domain errors for inventory-related error handling.
 */

import { NotFoundError } from "#/shared/domain/errors.ts";

/**
 * Error thrown when an inventory record is not found by ID.
 * Used for get, update, and delete operations on non-existent inventory records.
 */
export class InventoryNotFoundError extends NotFoundError {
  constructor(id: number) {
    super("Inventory", id);
  }
}

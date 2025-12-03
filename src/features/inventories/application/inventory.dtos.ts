/**
 * Data Transfer Objects for Inventory module.
 * Defines types for transferring inventory data between layers.
 *
 * @requirements 8.3
 */

import type { CreateInventoryInput } from "./inventory.schemas.ts";

/**
 * DTO for creating a new inventory record.
 * Extends the validated input with defaults applied.
 */
export interface CreateInventoryDTO {
  itemId: number;
  itemType: string;
  spaceId: number;
  spaceType: string;
  name?: string | null;
  code?: string | null;
  sku?: string | null;
  balance?: string;
  costPerUnit?: string | null;
  status?: string | null;
  notes?: string | null;
  modelType?: string | null;
  parentType?: string | null;
}

/**
 * DTO for inventory response data.
 * Represents the complete inventory data returned from API endpoints.
 */
export interface InventoryResponseDTO {
  id: number;
  itemId: number;
  itemType: string | null;
  spaceId: number;
  spaceType: string | null;
  name: string | null;
  code: string | null;
  sku: string | null;
  balance: string;
  costPerUnit: string | null;
  status: string | null;
  notes: string | null;
  modelType: string | null;
  parentType: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Re-export schema-inferred types for convenience.
 */
export type { CreateInventoryInput };

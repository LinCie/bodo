/**
 * Data Transfer Objects for Items module.
 * Defines types for transferring item data between layers.
 */

import type { ItemStatus } from "#/features/items/domain/item.entity.ts";
import type {
  CreateItemInput,
  FindAllQuery,
  UpdateItemInput,
} from "./item.schemas.ts";

/**
 * DTO for creating a new item.
 * Extends the validated input with defaults applied.
 */
export interface CreateItemDTO {
  name: string;
  code?: string | null;
  sku?: string | null;
  primaryCode?: string | null;
  description?: string | null;
  notes?: string | null;
  price?: string | null;
  cost?: string | null;
  weight?: string | null;
  status?: ItemStatus;
  spaceId?: number | null;
  spaceType?: string | null;
  parentId?: number | null;
  parentType?: string | null;
  modelId?: number | null;
  modelType?: string | null;
  typeId?: number | null;
  typeType?: string | null;
  images?: unknown | null;
  files?: unknown | null;
  links?: unknown | null;
  tags?: unknown | null;
  attributes?: unknown | null;
  options?: unknown | null;
  variants?: unknown | null;
  dimension?: unknown | null;
}

/**
 * DTO for updating an existing item.
 * All fields are optional.
 */
export interface UpdateItemDTO {
  name?: string;
  code?: string | null;
  sku?: string | null;
  primaryCode?: string | null;
  description?: string | null;
  notes?: string | null;
  price?: string | null;
  cost?: string | null;
  weight?: string | null;
  status?: ItemStatus;
  spaceId?: number | null;
  spaceType?: string | null;
  parentId?: number | null;
  parentType?: string | null;
  modelId?: number | null;
  modelType?: string | null;
  typeId?: number | null;
  typeType?: string | null;
  images?: unknown | null;
  files?: unknown | null;
  links?: unknown | null;
  tags?: unknown | null;
  attributes?: unknown | null;
  options?: unknown | null;
  variants?: unknown | null;
  dimension?: unknown | null;
}

/**
 * DTO for item response data.
 * Represents the complete item data returned from API endpoints.
 */
export interface ItemResponseDTO {
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
}

/**
 * DTO for commerce-type item response.
 * Contains only fields needed for commerce display.
 *
 * @requirements 2.6
 */
export interface CommerceItemResponseDTO {
  id: number;
  name: string;
  description: string | null;
  price: string | null;
  weight: string | null;
  images: unknown | null;
}

/**
 * DTO for item with inventory data.
 * Used when withInventories=true in query.
 *
 * @requirements 2.8
 */
export interface ItemWithInventoriesDTO extends ItemResponseDTO {
  inventories: InventoryResponseDTO[];
}

/**
 * DTO for inventory response data.
 */
export interface InventoryResponseDTO {
  spaceId: number;
  balance: string;
  notes: string | null;
  status: string | null;
  costPerUnit: string | null;
}

/**
 * Re-export schema-inferred types for convenience.
 */
export type { CreateItemInput, FindAllQuery, UpdateItemInput };

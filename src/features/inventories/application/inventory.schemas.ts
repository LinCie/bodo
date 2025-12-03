/**
 * Zod validation schemas for Inventory module.
 * Defines schemas for creating inventories and route parameters.
 *
 * @requirements 8.3
 */

import { z } from "zod";

/**
 * Schema for creating a new inventory record.
 * Required fields: itemId, itemType, spaceId, spaceType.
 * Balance defaults to "0" if not provided.
 *
 * @requirements 8.3
 */
export const createInventorySchema = z.object({
  itemId: z.coerce.number().int().positive({ message: "Item ID is required" }),
  itemType: z.string().min(1, "Item type is required"),
  spaceId: z.coerce.number().int().positive({
    message: "Space ID is required",
  }),
  spaceType: z.string().min(1, "Space type is required"),
  name: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  balance: z.coerce.string().optional().default("0"),
  costPerUnit: z.coerce.string().nullable().optional(),
  status: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  modelType: z.string().nullable().optional(),
  parentType: z.string().nullable().optional(),
});

/**
 * Schema for inventory ID route parameters.
 *
 * @requirements 8.3
 */
export const inventoryIdParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: "Inventory ID is required" }),
});

/**
 * Schema for querying inventories by item ID.
 *
 * @requirements 8.3
 */
export const inventoryByItemIdParamsSchema = z.object({
  itemId: z.coerce.number().int().positive({ message: "Item ID is required" }),
});

/**
 * Inferred types from schemas for use in application layer.
 */
export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type InventoryIdParams = z.infer<typeof inventoryIdParamsSchema>;
export type InventoryByItemIdParams = z.infer<
  typeof inventoryByItemIdParamsSchema
>;

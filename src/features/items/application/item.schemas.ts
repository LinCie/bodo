/**
 * Zod validation schemas for Items module.
 * Defines schemas for creating, updating, and querying items.
 */

import { z } from "zod";

/**
 * JSON schema for complex fields like images, files, attributes, etc.
 * Accepts objects, arrays, or any JSON-compatible value.
 */
const jsonSchema = z
  .union([z.record(z.string(), z.unknown()), z.array(z.unknown()), z.unknown()])
  .nullable()
  .optional();

/**
 * Valid status values for items.
 */
export const itemStatusSchema = z.enum(["active", "inactive", "archived"]);

/**
 * Schema for creating a new item.
 * Name is required, all other fields are optional.
 *
 * @requirements 8.3, 1.2, 1.3
 */
export const createItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  primaryCode: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  price: z.coerce.string().optional(),
  cost: z.coerce.string().optional(),
  weight: z.coerce.string().optional(),
  status: itemStatusSchema.optional(),
  spaceId: z.coerce.number().int().positive().nullable().optional(),
  spaceType: z.string().nullable().optional(),
  parentId: z.coerce.number().int().positive().nullable().optional(),
  parentType: z.string().nullable().optional(),
  modelId: z.coerce.number().int().positive().nullable().optional(),
  modelType: z.string().nullable().optional(),
  typeId: z.coerce.number().int().positive().nullable().optional(),
  typeType: z.string().nullable().optional(),
  images: jsonSchema,
  files: jsonSchema,
  links: jsonSchema,
  tags: jsonSchema,
  attributes: jsonSchema,
  options: jsonSchema,
  variants: jsonSchema,
  dimension: jsonSchema,
});

/**
 * Schema for updating an existing item.
 * All fields are optional (partial of create schema).
 *
 * @requirements 8.3
 */
export const updateItemSchema = createItemSchema.partial();

/**
 * Schema for querying items with filtering, pagination, and sorting.
 *
 * @requirements 8.3, 2.2, 2.3, 2.4, 2.5
 */
export const findAllQuerySchema = z.object({
  spaceId: z.coerce.number().int().positive({
    message: "Space ID is required",
  }),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  search: z.string().optional(),
  status: itemStatusSchema.optional().default("active"),
  sortBy: z.enum(["id", "name", "price", "createdAt"]).optional().default("id"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  type: z.enum(["commerce", "dashboard"]).optional().default("dashboard"),
  withInventories: z.coerce.boolean().optional().default(false),
});

/**
 * Schema for item ID route parameters.
 *
 * @requirements 8.3
 */
export const itemIdParamsSchema = z.object({
  id: z.coerce.number().int().positive({ message: "Item ID is required" }),
});

/**
 * Schema for AI chat prompt input.
 *
 * @requirements 8.3
 */
export const chatPromptSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
});

/**
 * Inferred types from schemas for use in application layer.
 */
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type FindAllQuery = z.infer<typeof findAllQuerySchema>;
export type ItemIdParams = z.infer<typeof itemIdParamsSchema>;
export type ChatPromptInput = z.infer<typeof chatPromptSchema>;

/**
 * Hono routes for Items module.
 * Exposes HTTP endpoints for item CRUD operations and inventory propagation.
 *
 * @requirements 8.4, 1.1, 2.1-2.9, 3.1, 4.1, 5.1, 6.1
 */

import { Hono } from "hono";
import { NotFoundError } from "#/shared/domain/errors.ts";
import { validate } from "#/shared/application/validation.ts";
import { errorToResponse, errorToStatus } from "#/shared/presentation/index.ts";
import type { IInventoryService } from "#/shared/domain/interfaces/inventory-service.interface.ts";
import type { ItemRepository } from "#/features/items/infrastructure/item.repository.ts";
import {
  chatPromptSchema,
  createItemSchema,
  findAllQuerySchema,
  itemIdParamsSchema,
  updateItemSchema,
} from "#/features/items/application/item.schemas.ts";
import type { ItemAIService } from "#/features/items/infrastructure/item.ai-service.ts";
import type { Item } from "#/features/items/domain/item.entity.ts";
import type {
  CommerceItemResponseDTO,
  InventoryResponseDTO,
  ItemResponseDTO,
  ItemWithInventoriesDTO,
} from "#/features/items/application/item.dtos.ts";

/**
 * Maps an Item entity to an ItemResponseDTO.
 * @param item - The Item entity
 * @returns ItemResponseDTO
 */
function itemToResponseDTO(item: Item): ItemResponseDTO {
  return {
    id: item.id,
    name: item.name,
    code: item.code,
    sku: item.sku,
    primaryCode: item.primaryCode,
    description: item.description,
    notes: item.notes,
    price: item.price,
    cost: item.cost,
    weight: item.weight,
    status: item.status,
    spaceId: item.spaceId,
    spaceType: item.spaceType,
    parentId: item.parentId,
    parentType: item.parentType,
    modelId: item.modelId,
    modelType: item.modelType,
    typeId: item.typeId,
    typeType: item.typeType,
    images: item.images,
    files: item.files,
    links: item.links,
    tags: item.tags,
    attributes: item.attributes,
    options: item.options,
    variants: item.variants,
    dimension: item.dimension,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt,
  };
}

/**
 * Maps an Item entity to a CommerceItemResponseDTO.
 * @param item - The Item entity
 * @returns CommerceItemResponseDTO with limited fields
 * @requirements 2.6
 */
function itemToCommerceDTO(item: Item): CommerceItemResponseDTO {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    weight: item.weight,
    images: item.images,
  };
}

/**
 * Dependencies required for item routes.
 */
export interface ItemRoutesDependencies {
  itemRepository: ItemRepository;
  inventoryService: IInventoryService;
  itemAIService?: ItemAIService;
}

/**
 * Creates Hono routes for items with injected dependencies.
 * @param deps - Dependencies for the routes
 * @returns Hono app with item routes
 */
export function createItemRoutes(deps: ItemRoutesDependencies): Hono {
  const { itemRepository, inventoryService, itemAIService } = deps;
  const app = new Hono();

  /**
   * GET /items - List items with filters
   * Supports pagination, search, status filter, sorting, and inventory inclusion.
   * @requirements 2.1-2.9
   */
  app.get("/", async (c) => {
    // Parse and validate query parameters
    const queryParams = c.req.query();
    const validationResult = validate(findAllQuerySchema, queryParams);

    if (validationResult.isErr()) {
      const error = validationResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    const query = validationResult.value;

    // Fetch items from repository
    const itemsResult = await itemRepository.findAllWithQuery(query);

    if (itemsResult.isErr()) {
      const error = itemsResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    const items = itemsResult.value;

    // Handle commerce type - return limited fields
    // @requirements 2.6
    if (query.type === "commerce") {
      const commerceItems = items.map(itemToCommerceDTO);
      return c.json({ data: commerceItems });
    }

    // Handle withInventories flag
    // @requirements 2.8
    if (query.withInventories) {
      const itemsWithInventories: ItemWithInventoriesDTO[] = [];

      for (const item of items) {
        const inventoriesResult = await inventoryService.findByItemId(item.id);
        const inventories: InventoryResponseDTO[] = inventoriesResult.isOk()
          ? inventoriesResult.value.map((inv) => ({
            spaceId: inv.spaceId,
            balance: inv.balance,
            notes: inv.notes,
            status: inv.status,
            costPerUnit: inv.costPerUnit,
          }))
          : [];

        itemsWithInventories.push({
          ...itemToResponseDTO(item),
          inventories,
        });
      }

      return c.json({ data: itemsWithInventories });
    }

    // Return standard item response
    const responseItems = items.map(itemToResponseDTO);
    return c.json({ data: responseItems });
  });

  /**
   * GET /items/:id - Get item by ID
   * Returns the complete item record or NotFoundError.
   * @requirements 3.1, 3.2, 3.3
   */
  app.get("/:id", async (c) => {
    // Validate path parameters
    const paramsResult = validate(itemIdParamsSchema, {
      id: c.req.param("id"),
    });

    if (paramsResult.isErr()) {
      const error = paramsResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    const { id } = paramsResult.value;

    // Fetch item from repository
    const itemResult = await itemRepository.findById(id);

    if (itemResult.isErr()) {
      const error = itemResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    const item = itemResult.value;

    if (!item) {
      const error = new NotFoundError("Item", id);
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    return c.json({ data: itemToResponseDTO(item) });
  });

  /**
   * POST /items - Create a new item
   * Creates an item with the provided data and returns the created record.
   * @requirements 1.1, 1.2, 1.3, 1.4, 1.5
   */
  app.post("/", async (c) => {
    // Parse and validate request body
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        { code: "VALIDATION_ERROR", message: "Invalid JSON body" },
        400,
      );
    }

    const validationResult = validate(createItemSchema, body);

    if (validationResult.isErr()) {
      const error = validationResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    const createData = validationResult.value;

    // Create item in repository
    const createResult = await itemRepository.create(createData);

    if (createResult.isErr()) {
      const error = createResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    const item = createResult.value;
    return c.json({ data: itemToResponseDTO(item) }, 201);
  });

  /**
   * PUT /items/:id - Update an existing item
   * Updates the item with the provided data and returns the updated record.
   * @requirements 4.1, 4.2, 4.3, 4.4
   */
  app.put("/:id", async (c) => {
    // Validate path parameters
    const paramsResult = validate(itemIdParamsSchema, {
      id: c.req.param("id"),
    });

    if (paramsResult.isErr()) {
      const error = paramsResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    const { id } = paramsResult.value;

    // Parse and validate request body
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        { code: "VALIDATION_ERROR", message: "Invalid JSON body" },
        400,
      );
    }

    const validationResult = validate(updateItemSchema, body);

    if (validationResult.isErr()) {
      const error = validationResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    const updateData = validationResult.value;

    // Update item in repository
    const updateResult = await itemRepository.update(id, updateData);

    if (updateResult.isErr()) {
      const error = updateResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    const item = updateResult.value;
    return c.json({ data: itemToResponseDTO(item) });
  });

  /**
   * DELETE /items/:id - Soft delete an item
   * Sets deletedAt timestamp and status to archived.
   * @requirements 5.1, 5.2, 5.3, 5.4
   */
  app.delete("/:id", async (c) => {
    // Validate path parameters
    const paramsResult = validate(itemIdParamsSchema, {
      id: c.req.param("id"),
    });

    if (paramsResult.isErr()) {
      const error = paramsResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    const { id } = paramsResult.value;

    // Delete item in repository (soft delete)
    const deleteResult = await itemRepository.delete(id);

    if (deleteResult.isErr()) {
      const error = deleteResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    return c.json({ success: true }, 200);
  });

  /**
   * POST /items/:id/inventory - Propagate inventory to child spaces
   * Creates inventory records in all child spaces that don't already have one.
   * @requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
   */
  app.post("/:id/inventory", async (c) => {
    // Validate path parameters
    const paramsResult = validate(itemIdParamsSchema, {
      id: c.req.param("id"),
    });

    if (paramsResult.isErr()) {
      const error = paramsResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    const { id } = paramsResult.value;

    // Fetch item from repository
    const itemResult = await itemRepository.findById(id);

    if (itemResult.isErr()) {
      const error = itemResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    const item = itemResult.value;

    if (!item) {
      const error = new NotFoundError("Item", id);
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    // Propagate inventory to child spaces
    const propagationResult = await inventoryService.propagateToChildSpaces({
      id: item.id,
      name: item.name,
      code: item.code,
      sku: item.sku,
      cost: item.cost,
      status: item.status,
      notes: item.notes,
      spaceId: item.spaceId,
      spaceType: item.spaceType,
    });

    if (propagationResult.isErr()) {
      const error = propagationResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    return c.json({ data: propagationResult.value });
  });

  /**
   * POST /items/chat - AI-powered natural language query
   * Interprets natural language prompts and returns relevant items.
   * @requirements 7.1, 7.2, 7.3, 7.4
   */
  app.post("/chat", async (c) => {
    // Check if AI service is available
    if (!itemAIService) {
      return c.json(
        {
          code: "AI_SERVICE_ERROR",
          message: "AI service is not configured",
        },
        503,
      );
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        { code: "VALIDATION_ERROR", message: "Invalid JSON body" },
        400,
      );
    }

    const validationResult = validate(chatPromptSchema, body);

    if (validationResult.isErr()) {
      const error = validationResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    const { prompt } = validationResult.value;

    // Generate AI response
    const aiResult = await itemAIService.generate(prompt);

    if (aiResult.isErr()) {
      const error = aiResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    return c.json({ data: { response: aiResult.value } });
  });

  return app;
}

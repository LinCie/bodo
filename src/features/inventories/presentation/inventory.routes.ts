/**
 * Hono routes for Inventory module.
 * Exposes HTTP endpoints for inventory queries.
 *
 * @requirements 2.8
 */

import { Hono } from "hono";
import { validate } from "#/shared/application/validation.ts";
import { errorToResponse, errorToStatus } from "#/shared/presentation/index.ts";
import type { IInventoryService } from "#/shared/domain/interfaces/inventory-service.interface.ts";
import { inventoryByItemIdParamsSchema } from "#/features/inventories/application/inventory.schemas.ts";

/**
 * Dependencies required for inventory routes.
 */
export interface InventoryRoutesDependencies {
  inventoryService: IInventoryService;
}

/**
 * Creates Hono routes for inventory with injected dependencies.
 * @param deps - Dependencies for the routes
 * @returns Hono app with inventory routes
 */
export function createInventoryRoutes(deps: InventoryRoutesDependencies): Hono {
  const { inventoryService } = deps;
  const app = new Hono();

  /**
   * GET /inventory/:itemId - Get inventories for an item
   * Returns all inventory records associated with the specified item.
   * @requirements 2.8
   */
  app.get("/:itemId", async (c) => {
    // Validate path parameters
    const paramsResult = validate(inventoryByItemIdParamsSchema, {
      itemId: c.req.param("itemId"),
    });

    if (paramsResult.isErr()) {
      const error = paramsResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    const { itemId } = paramsResult.value;

    // Fetch inventories from service
    const inventoriesResult = await inventoryService.findByItemId(itemId);

    if (inventoriesResult.isErr()) {
      const error = inventoriesResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    // Return inventory records directly
    // The InventoryRecord interface provides the essential fields for API response
    const inventories = inventoriesResult.value;

    return c.json({ data: inventories });
  });

  return app;
}

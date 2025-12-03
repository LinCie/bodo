/**
 * AI Service for Items module.
 * Provides natural language query capabilities using Google Gemini AI.
 *
 * @requirements 7.1, 7.2, 7.3, 7.4
 */

import type { FunctionDeclaration } from "@google/genai";
import type { DomainError } from "#/shared/domain/errors.ts";
import { AIServiceError } from "#/shared/domain/errors.ts";
import { Result } from "#/shared/domain/result.ts";
import { BaseAIService } from "#/shared/infrastructure/ai/index.ts";
import type { ItemRepository } from "#/features/items/infrastructure/item.repository.ts";
import type { FindAllQuery } from "#/features/items/application/item.dtos.ts";

/**
 * Function declaration for the findAll item search function.
 * Defines the parameters that Gemini can use to query items.
 */
const findAllFunctionDeclaration: FunctionDeclaration = {
  name: "findAll",
  description: "Get a list of items for a given space ID with optional filters",
  parametersJsonSchema: {
    type: "object",
    properties: {
      spaceId: {
        type: "string",
        description: "The ID of the space to get items for (required)",
      },
      page: {
        type: "number",
        description: "The page number to retrieve (default: 1)",
      },
      limit: {
        type: "number",
        description: "The number of items per page (default: 10, max: 100)",
      },
      status: {
        type: "string",
        description:
          "The status of the items to filter by: 'active', 'inactive', or 'archived' (default: 'active')",
      },
      sortBy: {
        type: "string",
        description:
          "The field to sort by: 'id', 'name', 'price', or 'createdAt' (default: 'id')",
      },
      sortOrder: {
        type: "string",
        description: "The sort order: 'asc' or 'desc' (default: 'asc')",
      },
      search: {
        type: "string",
        description: "Search term to filter items by name, code, SKU, or notes",
      },
      withInventories: {
        type: "boolean",
        description:
          "Whether to include associated inventories in the response (default: false)",
      },
    },
    required: ["spaceId"],
  },
};

/**
 * AI Service for natural language item queries.
 * Extends BaseAIService to use Google Gemini for interpreting user prompts.
 */
export class ItemAIService extends BaseAIService {
  constructor(
    private readonly itemRepository: ItemRepository,
    apiKey: string,
  ) {
    super({ apiKey });
  }

  /**
   * Get the function declarations for item queries.
   * @returns Array of function declarations for Gemini
   */
  protected getFunctionDeclarations(): FunctionDeclaration[] {
    return [findAllFunctionDeclaration];
  }

  /**
   * Process a function call from the AI response.
   * Handles the findAll function to query items.
   *
   * @param functionName - The name of the function to call
   * @param args - The arguments passed to the function
   * @returns Result containing the function response data or an error
   */
  protected async processFunctionCall(
    functionName: string,
    args: Record<string, unknown>,
  ): Promise<Result<unknown, DomainError>> {
    if (functionName === "findAll") {
      return await this.handleFindAll(args as Partial<FindAllQuery>);
    }

    return Result.err(
      new AIServiceError(`Unknown function: ${functionName}`),
    );
  }

  /**
   * Handle the findAll function call.
   * Executes the item query and returns formatted results.
   *
   * @param args - The query arguments from the AI
   * @returns Result containing the items data or an error
   */
  private async handleFindAll(
    args: Partial<FindAllQuery>,
  ): Promise<Result<unknown, DomainError>> {
    // Validate that spaceId is provided
    if (!args.spaceId) {
      return Result.err(
        new AIServiceError(
          "AI requested findAll without required spaceId parameter",
        ),
      );
    }

    // Build query with defaults
    const query: FindAllQuery = {
      spaceId: args.spaceId,
      page: args.page ?? 1,
      limit: args.limit ?? 10,
      status: args.status ?? "active",
      sortBy: args.sortBy ?? "id",
      sortOrder: args.sortOrder ?? "asc",
      search: args.search,
      type: "dashboard",
      withInventories: args.withInventories ?? false,
    };

    // Execute the query
    const itemsResult = await this.itemRepository.findAllWithQuery(query);

    if (itemsResult.isErr()) {
      return Result.err(itemsResult.error);
    }

    const items = itemsResult.value;

    // Return formatted response for the AI
    return Result.ok({
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        code: item.code,
        sku: item.sku,
        description: item.description,
        price: item.price,
        cost: item.cost,
        status: item.status,
      })),
      count: items.length,
    });
  }
}

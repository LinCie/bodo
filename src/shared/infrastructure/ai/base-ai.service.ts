/**
 * Base AI Service for Google Gemini integration.
 * Provides common functionality for AI-powered features across the application.
 */

import {
  type Content,
  FunctionCallingConfigMode,
  type FunctionDeclaration,
  type GenerateContentResponse,
  GoogleGenAI,
} from "@google/genai";
import type { DomainError } from "#/shared/domain/errors.ts";
import { AIServiceError } from "#/shared/domain/errors.ts";
import { Result } from "#/shared/domain/result.ts";

/**
 * Configuration for the base AI service.
 */
export interface BaseAIServiceConfig {
  /** Google Gemini API key */
  apiKey: string;
  /** Model to use for generation (default: gemini-2.0-flash-001) */
  model?: string;
}

/**
 * Abstract base class for AI services using Google Gemini.
 * Provides common functionality for function calling and content generation.
 */
export abstract class BaseAIService {
  protected readonly ai: GoogleGenAI;
  protected readonly model: string;

  constructor(config: BaseAIServiceConfig) {
    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
    this.model = config.model ?? "gemini-2.0-flash-001";
  }

  /**
   * Get the function declarations for this AI service.
   * Subclasses must implement this to define their available functions.
   */
  protected abstract getFunctionDeclarations(): FunctionDeclaration[];

  /**
   * Process a function call from the AI response.
   * Subclasses must implement this to handle their specific function calls.
   *
   * @param functionName - The name of the function to call
   * @param args - The arguments passed to the function
   * @returns Result containing the function response data or an error
   */
  protected abstract processFunctionCall(
    functionName: string,
    args: Record<string, unknown>,
  ): Promise<Result<unknown, DomainError>>;

  /**
   * Generate a response to a natural language prompt.
   * Handles function calling and returns a human-readable response.
   *
   * @param prompt - The natural language query from the user
   * @returns Result containing the AI-generated response text or an error
   */
  async generate(prompt: string): Promise<Result<string, DomainError>> {
    try {
      const functionDeclarations = this.getFunctionDeclarations();
      const functionNames = functionDeclarations
        .map((f) => f.name)
        .filter((name): name is string => name !== undefined);

      // Build initial conversation with user prompt
      const contents: Content[] = [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ];

      // First call to Gemini with function calling enabled
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents,
        config: {
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.AUTO,
              allowedFunctionNames: functionNames,
            },
          },
          tools: [{ functionDeclarations }],
        },
      });

      // Process function calls if any
      if (response.functionCalls && response.functionCalls.length > 0) {
        return await this.handleFunctionCalls(
          response,
          contents,
          functionDeclarations,
        );
      }

      // If no function calls, return the text response directly
      if (response.text) {
        return Result.ok(response.text);
      }

      return Result.err(
        new AIServiceError("Failed to generate content: no response received"),
      );
    } catch (error) {
      return Result.err(
        new AIServiceError(
          "AI service failed to process request",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Handle function calls from the AI response.
   * Processes each function call and sends results back to the model.
   *
   * @param response - The initial AI response containing function calls
   * @param contents - The conversation history
   * @param functionDeclarations - The function declarations for this service
   * @returns Result containing the final AI-generated response or an error
   */
  private async handleFunctionCalls(
    response: GenerateContentResponse,
    contents: Content[],
    functionDeclarations: FunctionDeclaration[],
  ): Promise<Result<string, DomainError>> {
    for (const functionCall of response.functionCalls!) {
      const functionName = functionCall.name ?? "";
      const args = (functionCall.args ?? {}) as Record<string, unknown>;

      // Process the function call using the subclass implementation
      const result = await this.processFunctionCall(functionName, args);

      if (result.isErr()) {
        return Result.err(result.error);
      }

      // Build function response for the model
      const functionResponse = {
        name: functionName,
        response: result.value as Record<string, unknown>,
      };

      // Add the model's response and function result to conversation
      if (response.candidates?.[0]?.content) {
        contents.push(response.candidates[0].content);
      }

      contents.push({
        role: "user",
        parts: [{ functionResponse }],
      });
    }

    // Get final response from the model with the function results
    try {
      const finalResponse = await this.ai.models.generateContent({
        model: this.model,
        contents,
        config: {
          tools: [{ functionDeclarations }],
        },
      });

      if (!finalResponse.text) {
        return Result.err(
          new AIServiceError(
            "Failed to generate final response: no text received",
          ),
        );
      }

      return Result.ok(finalResponse.text);
    } catch (error) {
      return Result.err(
        new AIServiceError(
          "AI service failed to generate final response",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }
}

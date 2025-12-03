/**
 * Shared HTTP error utilities for mapping domain errors to HTTP responses.
 * Used by presentation layer routes across all features.
 */

import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { DomainError, ValidationError } from "#/shared/domain/errors.ts";

/**
 * Maps a domain error to an HTTP status code.
 * @param error - The domain error
 * @returns HTTP status code compatible with Hono
 */
export function errorToStatus(error: DomainError): ContentfulStatusCode {
  if (error.code === "VALIDATION_ERROR") return 400;
  if (error.code === "NOT_FOUND") return 404;
  if (error.code === "DATABASE_ERROR") return 500;
  if (error.code === "AI_SERVICE_ERROR") return 500;
  return 500;
}

/**
 * Error response structure for HTTP responses.
 */
export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

/**
 * Maps a domain error to an error response object.
 * @param error - The domain error
 * @returns Error response object suitable for JSON serialization
 */
export function errorToResponse(error: DomainError): ErrorResponse {
  const response: ErrorResponse = {
    code: error.code,
    message: error.message,
  };

  if (error.code === "VALIDATION_ERROR" && "details" in error) {
    response.details = (error as ValidationError).details;
  }

  return response;
}

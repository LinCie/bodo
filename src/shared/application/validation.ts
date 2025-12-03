/**
 * Zod validation utilities returning Result type for consistent error handling.
 */

import { z } from "zod";
import { Result } from "#/shared/domain/result.ts";
import { ValidationError } from "#/shared/domain/errors.ts";

/**
 * Validates data against a Zod schema and returns a Result type.
 *
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns Result containing parsed data on success, or ValidationError on failure
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): Result<T, ValidationError> {
  const result = schema.safeParse(data);

  if (result.success) {
    return Result.ok(result.data);
  }

  const details: Record<string, string[]> = {};

  for (const issue of result.error.issues) {
    const path = issue.path.length > 0 ? issue.path.join(".") : "_root";
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(issue.message);
  }

  return Result.err(new ValidationError("Validation failed", details));
}

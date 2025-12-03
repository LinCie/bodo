/**
 * Case Mapper Utilities
 *
 * Provides conversion between snake_case (database) and camelCase (TypeScript).
 * **Feature: shared-base-structure, Property 6: Snake_case to camelCase round-trip**
 */

import { toCamelCase, toSnakeCase } from "@std/text";

/**
 * Converts a snake_case string to camelCase.
 * @param str - The snake_case string to convert
 * @returns The camelCase equivalent
 */
export function snakeToCamel(str: string): string {
  if (!str) return str;
  return toCamelCase(str);
}

/**
 * Converts a camelCase string to snake_case.
 * @param str - The camelCase string to convert
 * @returns The snake_case equivalent
 */
export function camelToSnake(str: string): string {
  if (!str) return str;
  return toSnakeCase(str);
}

/**
 * Maps a database row with snake_case keys to an entity object with camelCase keys.
 * @param row - The database row with snake_case keys
 * @returns An object with camelCase keys
 */
export function mapRowToEntity<T>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    result[snakeToCamel(key)] = value;
  }

  return result as T;
}

/**
 * Maps an entity object with camelCase keys to a database row with snake_case keys.
 * @param entity - The entity object with camelCase keys
 * @returns An object with snake_case keys
 */
export function mapEntityToRow<T>(entity: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (
    const [key, value] of Object.entries(entity as Record<string, unknown>)
  ) {
    result[camelToSnake(key)] = value;
  }

  return result;
}

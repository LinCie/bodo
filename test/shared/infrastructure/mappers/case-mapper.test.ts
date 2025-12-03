import { assertEquals } from "@std/assert";
import * as fc from "fast-check";
import {
  snakeToCamel,
  camelToSnake,
  mapRowToEntity,
  mapEntityToRow,
} from "#/shared/infrastructure/mappers/case-mapper.ts";

/**
 * Feature: shared-base-structure, Property 6: Snake_case to camelCase round-trip
 *
 * For any valid snake_case string, converting to camelCase and back to snake_case
 * SHALL produce the original string. For any database row with snake_case keys,
 * mapping to entity and back to row SHALL preserve all values.
 *
 * Validates: Requirements 2.7
 */

// Generator for valid snake_case strings (lowercase letters with underscores between words)
// Each word must have at least 2 chars to ensure proper round-trip with std library
const snakeCaseString = fc
  .array(fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 2, maxLength: 10 }), { minLength: 1, maxLength: 5 })
  .map((parts) => parts.join("_"));

// Generator for valid camelCase strings (starts with lowercase, subsequent words start with single uppercase)
// Each word must have at least 2 chars to ensure proper round-trip with std library
const camelCaseString = fc
  .array(fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 2, maxLength: 10 }), { minLength: 1, maxLength: 5 })
  .map((parts) => 
    parts.map((part, index) => 
      index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
    ).join("")
  );

Deno.test("snakeToCamel - converts snake_case to camelCase correctly", () => {
  fc.assert(
    fc.property(snakeCaseString, (str) => {
      const result = snakeToCamel(str);
      // Result should not contain underscores (except at start if original started with underscore)
      assertEquals(result.includes("_"), false);
    }),
    { numRuns: 100 }
  );
});

Deno.test("camelToSnake - converts camelCase to snake_case correctly", () => {
  fc.assert(
    fc.property(camelCaseString, (str) => {
      const result = camelToSnake(str);
      // Result should be all lowercase
      assertEquals(result, result.toLowerCase());
    }),
    { numRuns: 100 }
  );
});

Deno.test("snake_case to camelCase round-trip preserves original string", () => {
  fc.assert(
    fc.property(snakeCaseString, (str) => {
      const camel = snakeToCamel(str);
      const backToSnake = camelToSnake(camel);
      assertEquals(backToSnake, str);
    }),
    { numRuns: 100 }
  );
});

Deno.test("camelCase to snake_case round-trip preserves original string", () => {
  fc.assert(
    fc.property(camelCaseString, (str) => {
      const snake = camelToSnake(str);
      const backToCamel = snakeToCamel(snake);
      assertEquals(backToCamel, str);
    }),
    { numRuns: 100 }
  );
});


// Generator for database row objects with snake_case keys
const snakeCaseRow = fc.dictionary(
  snakeCaseString,
  fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null))
);

Deno.test("mapRowToEntity and mapEntityToRow round-trip preserves all values", () => {
  fc.assert(
    fc.property(snakeCaseRow, (row) => {
      const entity = mapRowToEntity<Record<string, unknown>>(row);
      const backToRow = mapEntityToRow(entity);
      assertEquals(backToRow, row);
    }),
    { numRuns: 100 }
  );
});

Deno.test("mapRowToEntity converts all keys from snake_case to camelCase", () => {
  fc.assert(
    fc.property(snakeCaseRow, (row) => {
      const entity = mapRowToEntity<Record<string, unknown>>(row);
      for (const key of Object.keys(entity)) {
        // camelCase keys should not contain underscores
        assertEquals(key.includes("_"), false);
      }
    }),
    { numRuns: 100 }
  );
});

Deno.test("mapEntityToRow converts all keys from camelCase to snake_case", () => {
  // Generator for entity objects with camelCase keys
  const camelCaseEntity = fc.dictionary(
    camelCaseString,
    fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null))
  );

  fc.assert(
    fc.property(camelCaseEntity, (entity) => {
      const row = mapEntityToRow(entity);
      for (const key of Object.keys(row)) {
        // snake_case keys should be all lowercase
        assertEquals(key, key.toLowerCase());
      }
    }),
    { numRuns: 100 }
  );
});

// Unit tests for edge cases
Deno.test("snakeToCamel - handles empty string", () => {
  assertEquals(snakeToCamel(""), "");
});

Deno.test("camelToSnake - handles empty string", () => {
  assertEquals(camelToSnake(""), "");
});

Deno.test("snakeToCamel - handles single word", () => {
  assertEquals(snakeToCamel("hello"), "hello");
});

Deno.test("camelToSnake - handles single word", () => {
  assertEquals(camelToSnake("hello"), "hello");
});

Deno.test("snakeToCamel - converts created_at to createdAt", () => {
  assertEquals(snakeToCamel("created_at"), "createdAt");
});

Deno.test("camelToSnake - converts createdAt to created_at", () => {
  assertEquals(camelToSnake("createdAt"), "created_at");
});

Deno.test("snakeToCamel - converts deleted_at to deletedAt", () => {
  assertEquals(snakeToCamel("deleted_at"), "deletedAt");
});

Deno.test("camelToSnake - converts deletedAt to deleted_at", () => {
  assertEquals(camelToSnake("deletedAt"), "deleted_at");
});

Deno.test("mapRowToEntity - converts database row correctly", () => {
  const row = {
    id: "123",
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-02"),
    deleted_at: null,
    user_name: "john",
  };

  const entity = mapRowToEntity<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: null;
    userName: string;
  }>(row);

  assertEquals(entity.id, "123");
  assertEquals(entity.createdAt, row.created_at);
  assertEquals(entity.updatedAt, row.updated_at);
  assertEquals(entity.deletedAt, null);
  assertEquals(entity.userName, "john");
});

Deno.test("mapEntityToRow - converts entity correctly", () => {
  const entity = {
    id: "123",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
    deletedAt: null,
    userName: "john",
  };

  const row = mapEntityToRow(entity);

  assertEquals(row.id, "123");
  assertEquals(row.created_at, entity.createdAt);
  assertEquals(row.updated_at, entity.updatedAt);
  assertEquals(row.deleted_at, null);
  assertEquals(row.user_name, "john");
});

Deno.test("mapRowToEntity - handles empty object", () => {
  const row = {};
  const entity = mapRowToEntity<Record<string, unknown>>(row);
  assertEquals(entity, {});
});

Deno.test("mapEntityToRow - handles empty object", () => {
  const entity = {};
  const row = mapEntityToRow(entity);
  assertEquals(row, {});
});

import { assertEquals, assertInstanceOf } from "@std/assert";
import * as fc from "fast-check";
import {
  DatabaseError,
  DomainError,
  NotFoundError,
  ValidationError,
} from "#/shared/domain/errors.ts";

/**
 * Feature: shared-base-structure, Property 4: Domain error structure
 *
 * For any DomainError instance (NotFoundError, ValidationError, DatabaseError),
 * the error SHALL have a non-empty `code` string property and a `message` string property.
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */

// Generators for valid inputs
const nonEmptyString = fc.string({ minLength: 1 });
const validationDetails = fc.dictionary(
  nonEmptyString,
  fc.array(fc.string(), { minLength: 1 }),
);

Deno.test("NotFoundError - has non-empty code and message string properties", () => {
  fc.assert(
    fc.property(nonEmptyString, fc.integer({ min: 1 }), (resource, id) => {
      const error = new NotFoundError(resource, id);

      assertEquals(typeof error.code, "string");
      assertEquals(error.code.length > 0, true);
      assertEquals(typeof error.message, "string");
      assertEquals(error.message.length > 0, true);
    }),
    { numRuns: 100 },
  );
});

Deno.test("ValidationError - has non-empty code and message string properties", () => {
  fc.assert(
    fc.property(nonEmptyString, validationDetails, (message, details) => {
      const error = new ValidationError(message, details);

      assertEquals(typeof error.code, "string");
      assertEquals(error.code.length > 0, true);
      assertEquals(typeof error.message, "string");
      assertEquals(error.message.length > 0, true);
    }),
    { numRuns: 100 },
  );
});

Deno.test("DatabaseError - has non-empty code and message string properties", () => {
  fc.assert(
    fc.property(nonEmptyString, (message) => {
      const error = new DatabaseError(message);

      assertEquals(typeof error.code, "string");
      assertEquals(error.code.length > 0, true);
      assertEquals(typeof error.message, "string");
      assertEquals(error.message.length > 0, true);
    }),
    { numRuns: 100 },
  );
});

Deno.test("All domain errors extend DomainError", () => {
  fc.assert(
    fc.property(nonEmptyString, fc.integer({ min: 1 }), (resource, id) => {
      const notFoundError = new NotFoundError(resource, id);
      const validationError = new ValidationError("validation failed", {});
      const databaseError = new DatabaseError("db error");

      assertInstanceOf(notFoundError, DomainError);
      assertInstanceOf(validationError, DomainError);
      assertInstanceOf(databaseError, DomainError);
    }),
    { numRuns: 100 },
  );
});

Deno.test("All domain errors extend Error", () => {
  fc.assert(
    fc.property(nonEmptyString, fc.integer({ min: 1 }), (resource, id) => {
      const notFoundError = new NotFoundError(resource, id);
      const validationError = new ValidationError("validation failed", {});
      const databaseError = new DatabaseError("db error");

      assertInstanceOf(notFoundError, Error);
      assertInstanceOf(validationError, Error);
      assertInstanceOf(databaseError, Error);
    }),
    { numRuns: 100 },
  );
});

// Unit tests for specific error types

Deno.test("NotFoundError - has correct code", () => {
  const error = new NotFoundError("User", 123);
  assertEquals(error.code, "NOT_FOUND");
});

Deno.test("NotFoundError - stores resource and id", () => {
  const error = new NotFoundError("User", 123);
  assertEquals(error.resource, "User");
  assertEquals(error.id, 123);
});

Deno.test("NotFoundError - generates descriptive message", () => {
  const error = new NotFoundError("User", 123);
  assertEquals(error.message, "User with id '123' not found");
});

Deno.test("ValidationError - has correct code", () => {
  const error = new ValidationError("Invalid input", { field: ["required"] });
  assertEquals(error.code, "VALIDATION_ERROR");
});

Deno.test("ValidationError - stores message and details", () => {
  const details = { email: ["invalid format", "required"] };
  const error = new ValidationError("Validation failed", details);
  assertEquals(error.message, "Validation failed");
  assertEquals(error.details, details);
});

Deno.test("DatabaseError - has correct code", () => {
  const error = new DatabaseError("Connection failed");
  assertEquals(error.code, "DATABASE_ERROR");
});

Deno.test("DatabaseError - stores message and optional cause", () => {
  const cause = new Error("Connection refused");
  const error = new DatabaseError("Database connection failed", cause);
  assertEquals(error.message, "Database connection failed");
  assertEquals(error.cause, cause);
});

Deno.test("DatabaseError - cause is optional", () => {
  const error = new DatabaseError("Query failed");
  assertEquals(error.message, "Query failed");
  assertEquals(error.cause, undefined);
});

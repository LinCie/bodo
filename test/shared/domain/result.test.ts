import { assertEquals } from "@std/assert";
import * as fc from "fast-check";
import { Result } from "#/shared/domain/result.ts";

/**
 * Feature: shared-base-structure, Property 3: Result type consistency
 *
 * For any value T, Result.ok(T).isOk() SHALL return true and Result.ok(T).isErr() SHALL return false.
 * For any error E, Result.err(E).isErr() SHALL return true and Result.err(E).isOk() SHALL return false.
 * The value property SHALL be accessible on Ok results and error property SHALL be accessible on Err results.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

Deno.test("Result.ok - isOk returns true, isErr returns false for any value", () => {
  fc.assert(
    fc.property(fc.anything(), (value) => {
      const result = Result.ok(value);
      assertEquals(result.isOk(), true);
      assertEquals(result.isErr(), false);
    }),
    { numRuns: 100 }
  );
});

Deno.test("Result.err - isErr returns true, isOk returns false for any error", () => {
  fc.assert(
    fc.property(fc.anything(), (error) => {
      const result = Result.err(error);
      assertEquals(result.isErr(), true);
      assertEquals(result.isOk(), false);
    }),
    { numRuns: 100 }
  );
});

Deno.test("Result.ok - value property is accessible and contains the original value", () => {
  fc.assert(
    fc.property(fc.anything(), (value) => {
      const result = Result.ok(value);
      assertEquals(result.value, value);
    }),
    { numRuns: 100 }
  );
});

Deno.test("Result.err - error property is accessible and contains the original error", () => {
  fc.assert(
    fc.property(fc.anything(), (error) => {
      const result = Result.err(error);
      assertEquals(result.error, error);
    }),
    { numRuns: 100 }
  );
});

Deno.test("Result.ok - has correct _tag discriminant", () => {
  fc.assert(
    fc.property(fc.anything(), (value) => {
      const result = Result.ok(value);
      assertEquals(result._tag, "Ok");
    }),
    { numRuns: 100 }
  );
});

Deno.test("Result.err - has correct _tag discriminant", () => {
  fc.assert(
    fc.property(fc.anything(), (error) => {
      const result = Result.err(error);
      assertEquals(result._tag, "Err");
    }),
    { numRuns: 100 }
  );
});

// Unit tests for edge cases
Deno.test("Result.ok - handles null value", () => {
  const result = Result.ok(null);
  assertEquals(result.isOk(), true);
  assertEquals(result.value, null);
});

Deno.test("Result.ok - handles undefined value", () => {
  const result = Result.ok(undefined);
  assertEquals(result.isOk(), true);
  assertEquals(result.value, undefined);
});

Deno.test("Result.err - handles null error", () => {
  const result = Result.err(null);
  assertEquals(result.isErr(), true);
  assertEquals(result.error, null);
});

Deno.test("Result.err - handles Error object", () => {
  const error = new Error("test error");
  const result = Result.err(error);
  assertEquals(result.isErr(), true);
  assertEquals(result.error, error);
  assertEquals(result.error.message, "test error");
});

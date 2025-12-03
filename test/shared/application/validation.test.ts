/**
 * Tests for validation utilities.
 *
 * **Feature: shared-base-structure, Property 5: Validation returns correct Result type**
 */

import { assertEquals, assertExists } from "@std/assert";
import * as fc from "fast-check";
import { z } from "zod";
import { validate } from "#/shared/application/validation.ts";
import { ValidationError } from "#/shared/domain/errors.ts";

Deno.test("validate - Property 5: Validation returns correct Result type", async (t) => {
  await t.step("returns Ok with parsed data when input is valid (property-based)", () => {
    // Test with string schema
    const stringSchema = z.string();
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = validate(stringSchema, input);
        return result.isOk() && result.value === input;
      }),
      { numRuns: 100 }
    );

    // Test with number schema
    const numberSchema = z.number();
    fc.assert(
      fc.property(fc.double({ noNaN: true }), (input) => {
        const result = validate(numberSchema, input);
        return result.isOk() && result.value === input;
      }),
      { numRuns: 100 }
    );

    // Test with object schema
    const objectSchema = z.object({
      name: z.string(),
      age: z.number(),
    });
    fc.assert(
      fc.property(
        fc.record({ name: fc.string(), age: fc.integer() }),
        (input) => {
          const result = validate(objectSchema, input);
          return (
            result.isOk() &&
            result.value.name === input.name &&
            result.value.age === input.age
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  await t.step("returns Err with ValidationError when input is invalid (property-based)", () => {
    const stringSchema = z.string();

    // Numbers should fail string validation
    fc.assert(
      fc.property(fc.double({ noNaN: true }), (input) => {
        const result = validate(stringSchema, input);
        return result.isErr() && result.error instanceof ValidationError;
      }),
      { numRuns: 100 }
    );

    // Objects should fail string validation
    fc.assert(
      fc.property(fc.object(), (input) => {
        const result = validate(stringSchema, input);
        return result.isErr() && result.error instanceof ValidationError;
      }),
      { numRuns: 100 }
    );
  });

  await t.step("ValidationError contains details with field paths", () => {
    const schema = z.object({
      email: z.string().email(),
      age: z.number().min(0),
    });

    const result = validate(schema, { email: "invalid", age: -5 });

    assertEquals(result.isErr(), true);
    if (result.isErr()) {
      assertEquals(result.error.code, "VALIDATION_ERROR");
      assertExists(result.error.details["email"]);
      assertExists(result.error.details["age"]);
    }
  });

  await t.step("handles nested object validation errors", () => {
    const schema = z.object({
      user: z.object({
        profile: z.object({
          name: z.string().min(1),
        }),
      }),
    });

    const result = validate(schema, { user: { profile: { name: "" } } });

    assertEquals(result.isErr(), true);
    if (result.isErr()) {
      assertExists(result.error.details["user.profile.name"]);
    }
  });

  await t.step("handles root-level validation errors", () => {
    const schema = z.string().min(5);
    const result = validate(schema, "abc");

    assertEquals(result.isErr(), true);
    if (result.isErr()) {
      assertExists(result.error.details["_root"]);
    }
  });

  await t.step("returns parsed/transformed data on success", () => {
    const schema = z.string().transform((s) => s.toUpperCase());
    const result = validate(schema, "hello");

    assertEquals(result.isOk(), true);
    if (result.isOk()) {
      assertEquals(result.value, "HELLO");
    }
  });

  await t.step("handles array validation", () => {
    const schema = z.array(z.number());

    // Valid array
    const validResult = validate(schema, [1, 2, 3]);
    assertEquals(validResult.isOk(), true);

    // Invalid array element
    const invalidResult = validate(schema, [1, "two", 3]);
    assertEquals(invalidResult.isErr(), true);
    if (invalidResult.isErr()) {
      assertExists(invalidResult.error.details["1"]);
    }
  });
});

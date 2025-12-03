import { assertEquals } from "@std/assert";
import * as fc from "fast-check";
import { BaseEntity, BaseEntityProps } from "#/shared/domain/entity.ts";

// Concrete implementation for testing the abstract class
class TestEntity extends BaseEntity {
  constructor(props: BaseEntityProps) {
    super(props);
  }
}

// Generator for valid BaseEntityProps
const baseEntityPropsArb = fc.record({
  id: fc.uuid(),
  createdAt: fc.date(),
  updatedAt: fc.date(),
  deletedAt: fc.option(fc.date(), { nil: null }),
});

/**
 * Feature: shared-base-structure, Property 1: Base entity contains required properties
 *
 * For any BaseEntity instance, the entity SHALL have `id` (string), `createdAt` (Date),
 * `updatedAt` (Date), and `deletedAt` (Date | null) properties with correct types.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */

Deno.test("BaseEntity - has id property of type string", () => {
  fc.assert(
    fc.property(baseEntityPropsArb, (props) => {
      const entity = new TestEntity(props);
      assertEquals(typeof entity.id, "string");
      assertEquals(entity.id, props.id);
    }),
    { numRuns: 100 }
  );
});

Deno.test("BaseEntity - has createdAt property of type Date", () => {
  fc.assert(
    fc.property(baseEntityPropsArb, (props) => {
      const entity = new TestEntity(props);
      assertEquals(entity.createdAt instanceof Date, true);
      assertEquals(entity.createdAt.getTime(), props.createdAt.getTime());
    }),
    { numRuns: 100 }
  );
});


Deno.test("BaseEntity - has updatedAt property of type Date", () => {
  fc.assert(
    fc.property(baseEntityPropsArb, (props) => {
      const entity = new TestEntity(props);
      assertEquals(entity.updatedAt instanceof Date, true);
      assertEquals(entity.updatedAt.getTime(), props.updatedAt.getTime());
    }),
    { numRuns: 100 }
  );
});

Deno.test("BaseEntity - has deletedAt property of type Date or null", () => {
  fc.assert(
    fc.property(baseEntityPropsArb, (props) => {
      const entity = new TestEntity(props);
      if (props.deletedAt === null) {
        assertEquals(entity.deletedAt, null);
      } else {
        assertEquals(entity.deletedAt instanceof Date, true);
        assertEquals(entity.deletedAt!.getTime(), props.deletedAt.getTime());
      }
    }),
    { numRuns: 100 }
  );
});

Deno.test("BaseEntity - isDeleted returns true when deletedAt is set", () => {
  fc.assert(
    fc.property(baseEntityPropsArb, (props) => {
      const entity = new TestEntity(props);
      const expected = props.deletedAt !== null;
      assertEquals(entity.isDeleted(), expected);
    }),
    { numRuns: 100 }
  );
});

/**
 * Feature: shared-base-structure, Property 2: Entity equality is determined by id
 *
 * For any two BaseEntity instances, they SHALL be equal if and only if they have
 * the same `id` value, regardless of other property values.
 *
 * Validates: Requirements 1.5
 */

Deno.test("BaseEntity - equals returns true for entities with same id", () => {
  fc.assert(
    fc.property(
      fc.uuid(),
      baseEntityPropsArb,
      baseEntityPropsArb,
      (sharedId, props1, props2) => {
        const entity1 = new TestEntity({ ...props1, id: sharedId });
        const entity2 = new TestEntity({ ...props2, id: sharedId });
        assertEquals(entity1.equals(entity2), true);
      }
    ),
    { numRuns: 100 }
  );
});

Deno.test("BaseEntity - equals returns false for entities with different ids", () => {
  fc.assert(
    fc.property(
      baseEntityPropsArb,
      baseEntityPropsArb,
      (props1, props2) => {
        // Ensure different ids by using precondition
        fc.pre(props1.id !== props2.id);
        const entity1 = new TestEntity(props1);
        const entity2 = new TestEntity(props2);
        assertEquals(entity1.equals(entity2), false);
      }
    ),
    { numRuns: 100 }
  );
});

// Unit tests for edge cases
Deno.test("BaseEntity - handles entity with null deletedAt", () => {
  const props: BaseEntityProps = {
    id: "test-id-123",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
    deletedAt: null,
  };
  const entity = new TestEntity(props);
  assertEquals(entity.isDeleted(), false);
  assertEquals(entity.deletedAt, null);
});

Deno.test("BaseEntity - handles entity with set deletedAt", () => {
  const deletedDate = new Date("2024-01-03");
  const props: BaseEntityProps = {
    id: "test-id-456",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
    deletedAt: deletedDate,
  };
  const entity = new TestEntity(props);
  assertEquals(entity.isDeleted(), true);
  assertEquals(entity.deletedAt, deletedDate);
});

Deno.test("BaseEntity - equality is reflexive", () => {
  const props: BaseEntityProps = {
    id: "test-id-789",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
  const entity = new TestEntity(props);
  assertEquals(entity.equals(entity), true);
});

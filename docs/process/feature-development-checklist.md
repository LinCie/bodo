# Feature Development Checklist

Step-by-step guide for building new features following vertical slice architecture.

## Phase 1: Planning

- [ ] Define feature scope and requirements
- [ ] Identify domain entities and their relationships
- [ ] Plan API endpoints and contracts
- [ ] Review existing shared code for reuse

**Example:** For an "items" feature:
- Entity: `Item` with name, description, owner
- Endpoints: `GET /items`, `POST /items`, `GET /items/:id`, `PUT /items/:id`, `DELETE /items/:id`

---

## Phase 2: Domain Layer

Create `src/features/{feature}/domain/` folder.

### 2.1 Define Entity

- [ ] Create entity file: `{entity}.entity.ts`
- [ ] Extend `BaseEntity` class
- [ ] Define domain-specific properties as `readonly`
- [ ] Add domain methods for business logic

**DO:**
```typescript
// src/features/items/domain/item.entity.ts
import { BaseEntity, BaseEntityProps } from "#/shared/domain/entity.ts";

interface ItemProps extends BaseEntityProps {
  name: string;
  description: string | null;
  ownerId: string;
}

export class Item extends BaseEntity {
  readonly name: string;
  readonly description: string | null;
  readonly ownerId: string;

  constructor(props: ItemProps) {
    super(props);
    this.name = props.name;
    this.description = props.description;
    this.ownerId = props.ownerId;
  }

  // Domain method example
  belongsTo(userId: string): boolean {
    return this.ownerId === userId;
  }
}
```

**DON'T:**
```typescript
// ❌ Don't include infrastructure concerns
class Item extends BaseEntity {
  dbConnection: Database;  // Wrong!
  
  async save() {           // Wrong! This belongs in repository
    await this.dbConnection.insert(this);
  }
}
```

### 2.2 Define Value Objects (if needed)

- [ ] Use for concepts with no identity
- [ ] Make immutable

**DO:**
```typescript
// src/features/items/domain/item-name.value-object.ts
export class ItemName {
  private constructor(readonly value: string) {}

  static create(value: string): Result<ItemName, ValidationError> {
    if (value.length < 1 || value.length > 100) {
      return Result.err(new ValidationError("Invalid item name", {
        name: ["Must be between 1 and 100 characters"]
      }));
    }
    return Result.ok(new ItemName(value));
  }
}
```

### 2.3 Define Domain Errors

- [ ] Extend appropriate base error class
- [ ] Include specific error codes

```typescript
// src/features/items/domain/item.errors.ts
import { NotFoundError, DomainError } from "#/shared/domain/errors.ts";

export class ItemNotFoundError extends NotFoundError {
  constructor(id: string) {
    super("Item", id);
  }
}

export class ItemAccessDeniedError extends DomainError {
  readonly code = "ITEM_ACCESS_DENIED";
  readonly message: string;

  constructor(itemId: string, userId: string) {
    const message = `User ${userId} cannot access item ${itemId}`;
    super(message);
    this.message = message;
  }
}
```

### 2.4 Create Index Export

```typescript
// src/features/items/domain/index.ts
export * from "./item.entity.ts";
export * from "./item.errors.ts";
```

---

## Phase 3: Infrastructure Layer

Create `src/features/{feature}/infrastructure/` folder.

### 3.1 Implement Repository

- [ ] Implement `BaseRepository` interface
- [ ] Use case mappers for all database operations
- [ ] Filter soft-deleted records
- [ ] Return `Result` types

**DO:**
```typescript
// src/features/items/infrastructure/item.repository.ts
import { BaseRepository } from "#/shared/domain/repository.ts";
import { Result } from "#/shared/domain/result.ts";
import { DatabaseError, DomainError } from "#/shared/domain/errors.ts";
import { mapRowToEntity, mapEntityToRow } from "#/shared/infrastructure/mappers/index.ts";
import { Item } from "../domain/item.entity.ts";

interface CreateItemDTO {
  name: string;
  description: string | null;
  ownerId: string;
}

interface UpdateItemDTO {
  name?: string;
  description?: string | null;
}

export class ItemRepository implements BaseRepository<Item, CreateItemDTO, UpdateItemDTO> {
  constructor(private db: Database) {}

  async findById(id: string): Promise<Result<Item | null, DomainError>> {
    try {
      const row = await this.db
        .selectFrom("items")
        .selectAll()
        .where("id", "=", id)
        .where("deleted_at", "is", null)  // Filter soft-deleted
        .executeTakeFirst();
      
      return Result.ok(row ? mapRowToEntity<Item>(row) : null);
    } catch (error) {
      return Result.err(new DatabaseError("Failed to find item", error));
    }
  }

  async findAll(): Promise<Result<Item[], DomainError>> {
    try {
      const rows = await this.db
        .selectFrom("items")
        .selectAll()
        .where("deleted_at", "is", null)  // Filter soft-deleted
        .execute();
      
      return Result.ok(rows.map(row => mapRowToEntity<Item>(row)));
    } catch (error) {
      return Result.err(new DatabaseError("Failed to find items", error));
    }
  }

  async create(data: CreateItemDTO): Promise<Result<Item, DomainError>> {
    try {
      const now = new Date();
      const id = crypto.randomUUID();
      
      const row = {
        id,
        ...mapEntityToRow(data),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };

      await this.db.insertInto("items").values(row).execute();
      
      return Result.ok(mapRowToEntity<Item>(row));
    } catch (error) {
      return Result.err(new DatabaseError("Failed to create item", error));
    }
  }

  async update(id: string, data: UpdateItemDTO): Promise<Result<Item, DomainError>> {
    try {
      const updateData = {
        ...mapEntityToRow(data),
        updated_at: new Date(),
      };

      await this.db
        .updateTable("items")
        .set(updateData)
        .where("id", "=", id)
        .where("deleted_at", "is", null)
        .execute();

      return this.findById(id) as Promise<Result<Item, DomainError>>;
    } catch (error) {
      return Result.err(new DatabaseError("Failed to update item", error));
    }
  }

  async delete(id: string): Promise<Result<boolean, DomainError>> {
    try {
      // Soft delete - set deleted_at timestamp
      await this.db
        .updateTable("items")
        .set({ deleted_at: new Date() })
        .where("id", "=", id)
        .execute();
      
      return Result.ok(true);
    } catch (error) {
      return Result.err(new DatabaseError("Failed to delete item", error));
    }
  }
}
```

**DON'T:**
```typescript
// ❌ Don't physically delete
async delete(id: string): Promise<Result<boolean, DomainError>> {
  await this.db.deleteFrom("items").where("id", "=", id).execute();
  return Result.ok(true);
}

// ❌ Don't expose database row types
async findById(id: string): Promise<DatabaseRow> {
  return await this.db.selectFrom("items").executeTakeFirst();
}
```

### 3.2 Create Index Export

```typescript
// src/features/items/infrastructure/index.ts
export * from "./item.repository.ts";
```

---

## Phase 4: Application Layer

Create `src/features/{feature}/application/` folder.

### 4.1 Define DTOs

- [ ] Separate DTOs for create, update, response
- [ ] Don't reuse domain entities as DTOs

```typescript
// src/features/items/application/item.dto.ts
export interface CreateItemInput {
  name: string;
  description?: string;
  ownerId: string;
}

export interface UpdateItemInput {
  name?: string;
  description?: string;
}

export interface ItemResponse {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}
```

### 4.2 Create Zod Schemas

- [ ] Use `validate()` helper for validation

```typescript
// src/features/items/application/item.schema.ts
import { z } from "zod";

export const createItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(1000).optional(),
  ownerId: z.string().uuid("Invalid owner ID"),
});

export const updateItemSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
});
```

### 4.3 Implement Use Cases

- [ ] Validate input first
- [ ] Return `Result` types
- [ ] Use early returns on errors

**DO:**
```typescript
// src/features/items/application/create-item.use-case.ts
import { Result } from "#/shared/domain/result.ts";
import { validate } from "#/shared/application/validation.ts";
import { DomainError, ValidationError } from "#/shared/domain/errors.ts";
import { Item } from "../domain/item.entity.ts";
import { ItemRepository } from "../infrastructure/item.repository.ts";
import { createItemSchema } from "./item.schema.ts";
import { CreateItemInput, ItemResponse } from "./item.dto.ts";

export class CreateItemUseCase {
  constructor(private itemRepository: ItemRepository) {}

  async execute(input: unknown): Promise<Result<ItemResponse, ValidationError | DomainError>> {
    // 1. Validate input
    const validationResult = validate(createItemSchema, input);
    if (validationResult.isErr()) {
      return validationResult;
    }
    const data = validationResult.value;

    // 2. Create item via repository
    const createResult = await this.itemRepository.create({
      name: data.name,
      description: data.description ?? null,
      ownerId: data.ownerId,
    });
    if (createResult.isErr()) {
      return createResult;
    }

    // 3. Map to response
    const item = createResult.value;
    return Result.ok({
      id: item.id,
      name: item.name,
      description: item.description,
      ownerId: item.ownerId,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    });
  }
}
```

**DON'T:**
```typescript
// ❌ Don't throw exceptions
async execute(input: CreateItemInput): Promise<ItemResponse> {
  const parsed = createItemSchema.parse(input);  // Throws!
  const item = await this.itemRepository.create(parsed);
  return item;
}
```

### 4.4 Create Index Export

```typescript
// src/features/items/application/index.ts
export * from "./item.dto.ts";
export * from "./item.schema.ts";
export * from "./create-item.use-case.ts";
```

---

## Phase 5: Presentation Layer

Create `src/features/{feature}/presentation/` folder.

### 5.1 Create Route Handlers

- [ ] Parse request, call use case, map response
- [ ] Map `Result` types to HTTP responses
- [ ] Map domain errors to status codes

**DO:**
```typescript
// src/features/items/presentation/item.routes.ts
import { Hono } from "hono";
import { NotFoundError, ValidationError, DatabaseError } from "#/shared/domain/errors.ts";
import { CreateItemUseCase } from "../application/create-item.use-case.ts";
import { GetItemUseCase } from "../application/get-item.use-case.ts";

export function createItemRoutes(
  createItemUseCase: CreateItemUseCase,
  getItemUseCase: GetItemUseCase
) {
  const app = new Hono();

  // POST /items
  app.post("/", async (c) => {
    const body = await c.req.json();
    const result = await createItemUseCase.execute(body);

    if (result.isErr()) {
      return mapErrorToResponse(c, result.error);
    }

    return c.json(result.value, 201);
  });

  // GET /items/:id
  app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const result = await getItemUseCase.execute(id);

    if (result.isErr()) {
      return mapErrorToResponse(c, result.error);
    }

    if (!result.value) {
      return c.json({ error: "Item not found" }, 404);
    }

    return c.json(result.value);
  });

  return app;
}

function mapErrorToResponse(c: Context, error: DomainError) {
  if (error instanceof ValidationError) {
    return c.json({ error: error.message, details: error.details }, 400);
  }
  if (error instanceof NotFoundError) {
    return c.json({ error: error.message }, 404);
  }
  if (error instanceof DatabaseError) {
    // Don't expose internal details
    return c.json({ error: "Internal server error" }, 500);
  }
  return c.json({ error: "Unknown error" }, 500);
}
```

**DON'T:**
```typescript
// ❌ Don't expose internal error details
if (error instanceof DatabaseError) {
  return c.json({ error: error.message, stack: error.stack }, 500);
}
```

### 5.2 Create Index Export

```typescript
// src/features/items/presentation/index.ts
export * from "./item.routes.ts";
```

---

## Phase 6: Testing

Create `test/features/{feature}/` folder structure.

### 6.1 Property-Based Tests

- [ ] Annotate with `**Feature: {name}, Property {n}: {text}**`
- [ ] Use fast-check generators

```typescript
// test/features/items/domain/item.entity.test.ts
import { assertEquals } from "@std/assert";
import fc from "fast-check";
import { Item } from "#/features/items/domain/item.entity.ts";

// **Feature: items, Property 1: Item creation preserves all input data**
Deno.test("Item creation preserves all input data", () => {
  const itemArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string(), { nil: null }),
    ownerId: fc.uuid(),
    createdAt: fc.date(),
    updatedAt: fc.date(),
    deletedAt: fc.constant(null),
  });

  fc.assert(
    fc.property(itemArbitrary, (props) => {
      const item = new Item(props);
      return (
        item.id === props.id &&
        item.name === props.name &&
        item.description === props.description &&
        item.ownerId === props.ownerId
      );
    })
  );
});

// **Feature: items, Property 2: Item.belongsTo correctly identifies owner**
Deno.test("Item.belongsTo correctly identifies owner", () => {
  fc.assert(
    fc.property(fc.uuid(), fc.uuid(), (ownerId, otherId) => {
      const item = new Item({
        id: crypto.randomUUID(),
        name: "Test",
        description: null,
        ownerId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      
      return item.belongsTo(ownerId) === true && 
             (ownerId === otherId || item.belongsTo(otherId) === false);
    })
  );
});
```

### 6.2 Unit Tests for Edge Cases

```typescript
// test/features/items/application/create-item.use-case.test.ts
import { assertEquals, assertInstanceOf } from "@std/assert";
import { CreateItemUseCase } from "#/features/items/application/create-item.use-case.ts";
import { ValidationError } from "#/shared/domain/errors.ts";

Deno.test("CreateItemUseCase returns ValidationError for empty name", async () => {
  const useCase = new CreateItemUseCase(mockRepository);
  
  const result = await useCase.execute({
    name: "",
    ownerId: "123e4567-e89b-12d3-a456-426614174000",
  });

  assertEquals(result.isErr(), true);
  if (result.isErr()) {
    assertInstanceOf(result.error, ValidationError);
  }
});
```

### 6.3 Run Tests

```bash
deno task test
```

---

## Phase 7: Integration

### 7.1 Create Feature Index

```typescript
// src/features/items/index.ts
export * from "./domain/index.ts";
export * from "./application/index.ts";
export * from "./infrastructure/index.ts";
export * from "./presentation/index.ts";
```

### 7.2 Register Routes in Server

```typescript
// src/server.ts
import { Hono } from "hono";
import { createItemRoutes } from "#/features/items/presentation/item.routes.ts";

const app = new Hono();

// ... middleware setup ...

// Register feature routes
const itemRoutes = createItemRoutes(createItemUseCase, getItemUseCase);
app.route("/items", itemRoutes);

Deno.serve(app.fetch);
```

### 7.3 Manual API Testing

```bash
# Create item
curl -X POST http://localhost:8000/items \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Item", "ownerId": "123e4567-e89b-12d3-a456-426614174000"}'

# Get item
curl http://localhost:8000/items/{id}
```

---

## Final Checklist

- [ ] All layers created (`domain/`, `application/`, `infrastructure/`, `presentation/`)
- [ ] Entity extends `BaseEntity`
- [ ] Repository implements `BaseRepository`
- [ ] All operations return `Result` types
- [ ] Input validation with Zod schemas
- [ ] Soft deletion implemented
- [ ] Case mappers used for database operations
- [ ] Property-based tests written
- [ ] Unit tests for edge cases
- [ ] All tests passing
- [ ] Routes registered in server
- [ ] Manual API testing completed

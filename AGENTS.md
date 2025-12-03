# AGENTS.md

Instructions for AI agents working on this codebase.

## Project Overview

Deno + Hono REST API using vertical slice architecture with clean architecture
principles. TypeScript-first with strict mode enabled.

## Technology Stack

| Technology | Purpose                          |
| ---------- | -------------------------------- |
| Deno       | Runtime with built-in TypeScript |
| Hono       | Web framework for HTTP routing   |
| Kysely     | Type-safe SQL query builder      |
| Zod        | Schema validation                |
| fast-check | Property-based testing           |

## Commands

```bash
deno task dev      # Development with hot reload
deno task start    # Production server
deno task test     # Run all tests
deno lint          # Check linting
deno fmt           # Format code
```

## Project Structure

```
src/
├── features/                    # Feature slices (self-contained)
│   ├── auth/                    # Authentication feature
│   │   ├── domain/              # Entities, value objects, errors
│   │   ├── application/         # Use cases, DTOs, validation schemas
│   │   ├── infrastructure/      # Repositories, external services
│   │   └── presentation/        # HTTP handlers, routes
│   ├── inventories/             # Inventories feature (same structure)
│   └── items/                   # Items feature (same structure)
├── shared/                      # Shared code across features
│   ├── domain/                  # BaseEntity, Result type, errors
│   ├── application/             # Validation utilities
│   ├── infrastructure/          # Mappers, middlewares, logger, persistence
│   └── presentation/            # Common HTTP utilities
└── server.ts                    # Application entry point

test/                            # Mirrors src/ structure
```

## Architecture Rules

### Layer Dependencies (CRITICAL)

Dependencies MUST point inward toward domain. The domain layer has NO external
dependencies.

```
Presentation → Application → Domain ← Infrastructure
```

**Allowed imports per layer:**

| Layer          | Can Import From                                   |
| -------------- | ------------------------------------------------- |
| Domain         | Shared domain only, NO infrastructure/application |
| Application    | Domain, shared application, Zod                   |
| Infrastructure | Domain, shared infrastructure, Kysely             |
| Presentation   | Application, domain, Hono                         |

### Import Alias

Use `#/` for absolute imports from `src/`:

```typescript
// ✅ Correct
import { Result } from "#/shared/domain/result.ts";

// ❌ Wrong
import { Result } from "../../../../shared/domain/result.ts";
```

### Feature Slice Isolation

Feature slices MUST NOT import directly from each other. Use shared interfaces
for cross-slice communication.

```typescript
// ❌ FORBIDDEN
import { UserRepository } from "#/features/auth/infrastructure/user.repository.ts";

// ✅ Use shared interfaces instead
import { IUserLookup } from "#/shared/domain/interfaces/user-lookup.interface.ts";
```

## Required Patterns

### 1. Result Type for All Fallible Operations

NEVER throw exceptions for business logic. Always return `Result<T, E>`.

```typescript
// ✅ Correct
function findUser(id: string): Promise<Result<User | null, DomainError>> {
  const user = await repository.findById(id);
  if (!user) {
    return Result.err(new NotFoundError("User", id));
  }
  return Result.ok(user);
}

// ❌ Wrong - throws exception
function findUser(id: string): Promise<User> {
  const user = await repository.findById(id);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}
```

### 2. BaseEntity Extension

All domain entities MUST extend `BaseEntity`:

```typescript
import { BaseEntity, BaseEntityProps } from "#/shared/domain/entity.ts";

interface ItemProps extends BaseEntityProps {
  name: string;
  description: string | null;
}

class Item extends BaseEntity {
  readonly name: string;
  readonly description: string | null;

  constructor(props: ItemProps) {
    super(props);
    this.name = props.name;
    this.description = props.description;
  }
}
```

### 3. BaseRepository Implementation

All repositories MUST implement `BaseRepository` interface:

```typescript
import { BaseRepository } from "#/shared/domain/repository.ts";

class ItemRepository
  implements BaseRepository<Item, CreateItemDTO, UpdateItemDTO> {
  async findById(id: string): Promise<Result<Item | null, DomainError>> {
    /* ... */
  }
  async findAll(): Promise<Result<Item[], DomainError>> {/* ... */}
  async create(data: CreateItemDTO): Promise<Result<Item, DomainError>> {
    /* ... */
  }
  async update(
    id: string,
    data: UpdateItemDTO,
  ): Promise<Result<Item, DomainError>> {/* ... */}
  async delete(id: string): Promise<Result<boolean, DomainError>> {/* ... */}
}
```

### 4. Zod Validation for External Input

All external input MUST be validated using Zod schemas:

```typescript
import { z } from "zod";
import { validate } from "#/shared/application/validation.ts";

const createItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
});

async function createItem(
  input: unknown,
): Promise<Result<Item, ValidationError | DomainError>> {
  const validationResult = validate(createItemSchema, input);
  if (validationResult.isErr()) {
    return validationResult;
  }
  // Continue with validated data
}
```

### 5. Soft Deletion (NEVER Physical Delete)

Records are NEVER physically deleted. Set `deletedAt` timestamp instead:

```typescript
// ✅ Correct - soft delete
async delete(id: string): Promise<Result<boolean, DomainError>> {
  await db.updateTable("items")
    .set({ deleted_at: new Date() })
    .where("id", "=", id)
    .execute();
  return Result.ok(true);
}

// ❌ Wrong - physical delete
async delete(id: string): Promise<void> {
  await db.deleteFrom("items").where("id", "=", id).execute();
}
```

Always filter soft-deleted records in queries:

```typescript
const rows = await db.selectFrom("items")
  .where("deleted_at", "is", null) // Required!
  .execute();
```

### 6. Case Mapping Convention

| Context               | Convention | Example                       |
| --------------------- | ---------- | ----------------------------- |
| Database columns      | snake_case | `created_at`, `user_id`       |
| TypeScript properties | camelCase  | `createdAt`, `userId`         |
| File names            | kebab-case | `user-repository.ts`          |
| Classes/Interfaces    | PascalCase | `UserEntity`, `CreateUserDTO` |

Use case mappers for database operations:

```typescript
import {
  mapEntityToRow,
  mapRowToEntity,
} from "#/shared/infrastructure/mappers/index.ts";

const user = mapRowToEntity<User>(row); // snake_case → camelCase
const row = mapEntityToRow(user); // camelCase → snake_case
```

## Prohibited Patterns

1. **Throwing exceptions for business logic** - Use Result type
2. **Direct database access outside repositories** - All DB queries in
   infrastructure layer
3. **Circular dependencies between features** - Use shared interfaces
4. **Domain layer importing infrastructure** - Domain must be pure
5. **Physical deletion of records** - Use soft deletion
6. **Mutable entity properties** - Use `readonly`
7. **Implicit `any` types** - Explicit types for public APIs

## Naming Conventions

| Element             | Convention       | Example                       |
| ------------------- | ---------------- | ----------------------------- |
| Variables/Functions | camelCase        | `userName`, `findById()`      |
| Classes/Interfaces  | PascalCase       | `UserEntity`, `CreateUserDTO` |
| Constants           | UPPER_SNAKE_CASE | `MAX_RETRIES`                 |
| Files               | kebab-case       | `user-repository.ts`          |
| Database columns    | snake_case       | `created_at`                  |

## Error Handling

### Error Types

| Error Type        | HTTP Status | Use Case            |
| ----------------- | ----------- | ------------------- |
| `ValidationError` | 400         | Invalid input       |
| `NotFoundError`   | 404         | Resource not found  |
| `DatabaseError`   | 500         | Data access failure |

### Error Propagation

Use early returns on errors:

```typescript
const result = await repository.findById(id);
if (result.isErr()) {
  return result; // Propagate error
}
const entity = result.value;
```

## Testing Requirements

### Property-Based Tests

Use fast-check with annotation format:

```typescript
import fc from "fast-check";

// **Feature: items, Property 1: Item creation preserves all input data**
Deno.test("Item creation preserves all input data", () => {
  fc.assert(
    fc.property(
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 100 }),
        description: fc.string(),
      }),
      (input) => {
        const item = createItem(input);
        return item.name === input.name;
      },
    ),
  );
});
```

### Test File Organization

Mirror `src/` structure in `test/`:

```
test/
├── shared/
│   ├── domain/
│   │   └── result.test.ts
│   └── application/
│       └── validation.test.ts
└── features/
    └── items/
        └── domain/
            └── item.entity.test.ts
```

## Creating New Features

Follow vertical slice architecture:

1. **Domain Layer** (`src/features/{feature}/domain/`)
   - Entity extending `BaseEntity`
   - Domain errors
   - Value objects (if needed)

2. **Infrastructure Layer** (`src/features/{feature}/infrastructure/`)
   - Repository implementing `BaseRepository`
   - Case mappers for DB operations
   - Soft deletion in delete method

3. **Application Layer** (`src/features/{feature}/application/`)
   - DTOs (Create, Update, Response)
   - Zod validation schemas
   - Use cases returning `Result` types

4. **Presentation Layer** (`src/features/{feature}/presentation/`)
   - Hono route handlers
   - Error-to-HTTP-status mapping

5. **Register routes** in `src/server.ts`

## Cross-Slice Communication

When features need to interact:

1. **Data sharing**: Define interface in `#/shared/domain/interfaces/`
2. **Events**: Define events in `#/shared/domain/events/`
3. **Anti-corruption**: Create adapters to map between slice models

```typescript
// Define in shared
export interface IUserLookup {
  findById(id: string): Promise<Result<UserInfo | null, DomainError>>;
}

// Implement in source feature (auth)
class UserLookupService implements IUserLookup {/* ... */}

// Consume in target feature (items) via dependency injection
class ItemService {
  constructor(private userLookup: IUserLookup) {}
}
```

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore
```

Examples:

```
feat(auth): add password reset functionality
fix(items): handle null description in item creation
docs: update API endpoint documentation
```

## Documentation

- JSDoc for public functions with `@param` and `@returns`
- Document error conditions
- No TODO comments without issue references

## Library Documentation (CRITICAL)

AI agents have NO prior knowledge of any library, framework, or package. Before
using ANY library (including Hono, Kysely, Zod, fast-check, etc.), agents MUST:

1. **Resolve the library ID** using `mcp_Context7_resolve_library_id`
2. **Fetch current documentation** using `mcp_Context7_get_library_docs`

```typescript
// ❌ FORBIDDEN - Using library without checking Context7
import { Hono } from "hono";
const app = new Hono(); // Don't assume API knowledge

// ✅ REQUIRED - Always fetch docs first
// 1. Call: mcp_Context7_resolve_library_id({ libraryName: "hono" })
// 2. Call: mcp_Context7_get_library_docs({ context7CompatibleLibraryID: "/honojs/hono", topic: "routing" })
// 3. Then implement based on retrieved documentation
```

**This applies to:**

- Hono (routing, middleware, context)
- Kysely (query building, migrations)
- Zod (schema definitions, validation)
- fast-check (arbitraries, properties)
- Any new dependency added to the project

**No exceptions.** Do not rely on training data for library APIs—always verify
with Context7.

# Coding Guidelines

Code style and conventions for the project.

## TypeScript Conventions

### Strict Mode

TypeScript strict mode is enabled. All code must pass strict type checking.

### Explicit Types for Public APIs

**DO:**
```typescript
function createUser(data: CreateUserDTO): Result<User, ValidationError> {
  // ...
}

interface UserService {
  findById(id: string): Promise<Result<User | null, DomainError>>;
}
```

**DON'T:**
```typescript
function createUser(data) {  // ❌ Implicit any
  // ...
}
```

### Readonly Properties

Use `readonly` for properties that shouldn't change after construction.

**DO:**
```typescript
class User extends BaseEntity {
  readonly email: string;
  readonly name: string;
  
  constructor(props: UserProps) {
    super(props);
    this.email = props.email;
    this.name = props.name;
  }
}
```

**DON'T:**
```typescript
class User extends BaseEntity {
  email: string;  // ❌ Mutable when it shouldn't be
  name: string;
}
```

### Interface vs Type

- Use `interface` for object shapes
- Use `type` for unions, intersections, and aliases

**DO:**
```typescript
// Object shapes
interface UserProps {
  id: string;
  email: string;
  name: string;
}

// Unions and aliases
type Result<T, E> = Ok<T> | Err<E>;
type UserId = string;
```

---

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Variables | camelCase | `userName`, `itemCount` |
| Functions | camelCase | `findById()`, `createUser()` |
| Classes | PascalCase | `UserEntity`, `ItemRepository` |
| Interfaces | PascalCase | `CreateUserDTO`, `IUserService` |
| Types | PascalCase | `Result`, `ValidationError` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `DEFAULT_TIMEOUT` |
| Files | kebab-case | `user-repository.ts`, `create-user.dto.ts` |
| Database columns | snake_case | `created_at`, `user_id` |

### Examples

**DO:**
```typescript
// Variables and functions
const userName = "John";
function findUserById(id: string) { }

// Classes and interfaces
class UserEntity extends BaseEntity { }
interface CreateUserDTO { }

// Files
// user-repository.ts
// create-user.dto.ts
```

**DON'T:**
```typescript
// Variables
const user_name = "John";     // ❌ snake_case
const UserName = "John";      // ❌ PascalCase

// Functions
function FindUserById() { }   // ❌ PascalCase
function find_user_by_id() { } // ❌ snake_case

// Files
// userRepository.ts          // ❌ camelCase
// CreateUserDTO.ts           // ❌ PascalCase
```

---

## Error Handling with Result Type

### Return Result for Fallible Operations

**DO:**
```typescript
async function createUser(data: CreateUserDTO): Promise<Result<User, ValidationError | DatabaseError>> {
  const validationResult = validate(createUserSchema, data);
  if (validationResult.isErr()) {
    return validationResult;
  }
  
  const user = await repository.create(validationResult.value);
  return user;
}
```

**DON'T:**
```typescript
async function createUser(data: CreateUserDTO): Promise<User> {
  const parsed = createUserSchema.parse(data);  // ❌ Throws on error
  return await repository.create(parsed);
}
```

### Early Return on Errors

**DO:**
```typescript
async function processOrder(orderId: string): Promise<Result<Order, DomainError>> {
  const orderResult = await orderRepository.findById(orderId);
  if (orderResult.isErr()) {
    return orderResult;  // Early return
  }
  
  const order = orderResult.value;
  if (!order) {
    return Result.err(new NotFoundError("Order", orderId));
  }
  
  // Continue processing...
  return Result.ok(order);
}
```

**DON'T:**
```typescript
async function processOrder(orderId: string): Promise<Order | null> {
  try {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      return null;  // ❌ Null doesn't explain why
    }
    return order;
  } catch (e) {
    throw e;  // ❌ Re-throwing exceptions
  }
}
```

---

## Testing Requirements

### Property-Based Tests

Use fast-check for property-based testing with the annotation format:

**DO:**
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
        return item.name === input.name && item.description === input.description;
      }
    )
  );
});
```

### Unit Tests for Edge Cases

**DO:**
```typescript
Deno.test("findById returns NotFoundError for non-existent id", async () => {
  const result = await repository.findById("non-existent-id");
  
  assert(result.isErr());
  assertInstanceOf(result.error, NotFoundError);
});

Deno.test("validate returns ValidationError for invalid email", () => {
  const result = validate(userSchema, { email: "invalid" });
  
  assert(result.isErr());
  assertEquals(result.error.details.email, ["Invalid email"]);
});
```

**DON'T:**
```typescript
// ❌ Only testing happy path
Deno.test("createUser works", async () => {
  const result = await createUser({ email: "test@example.com", name: "Test" });
  assert(result.isOk());
});
```

### Test File Organization

Mirror the `src/` structure in `test/`:

```
test/
├── shared/
│   ├── domain/
│   │   ├── entity.test.ts
│   │   ├── result.test.ts
│   │   └── errors.test.ts
│   └── application/
│       └── validation.test.ts
└── features/
    └── items/
        └── domain/
            └── item.entity.test.ts
```

---

## Documentation Standards

### JSDoc for Public Functions

**DO:**
```typescript
/**
 * Validates data against a Zod schema and returns a Result type.
 *
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns Result containing parsed data on success, or ValidationError on failure
 *
 * @example
 * const result = validate(userSchema, { email: "test@example.com" });
 * if (result.isOk()) {
 *   console.log(result.value);
 * }
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Result<T, ValidationError> {
  // ...
}
```

**DON'T:**
```typescript
// ❌ No documentation
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): Result<T, ValidationError> {
  // ...
}
```

### Document Error Conditions

**DO:**
```typescript
/**
 * Finds a user by their unique identifier.
 *
 * @param id - The user's unique identifier
 * @returns Result containing the user if found, null if not found, or DatabaseError on failure
 * @throws Never - all errors are returned as Result.err()
 */
async findById(id: string): Promise<Result<User | null, DatabaseError>>;
```

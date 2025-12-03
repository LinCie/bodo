# Architecture Rules

Required and prohibited patterns with comprehensive examples.

## Required Patterns

### 1. Result Type for All Fallible Operations

Every function that can fail must return a `Result<T, E>` type.

**DO:**
```typescript
function findUser(id: string): Promise<Result<User | null, DomainError>> {
  // Implementation
}

function createUser(data: CreateUserDTO): Promise<Result<User, ValidationError | DatabaseError>> {
  // Implementation
}

// Check result before accessing value
const result = await findUser(id);
if (result.isOk()) {
  const user = result.value;
}
if (result.isErr()) {
  const error = result.error;
}
```

### 2. BaseEntity Extension

All domain entities must extend `BaseEntity` to inherit common properties.

**DO:**
```typescript
import { BaseEntity, BaseEntityProps } from "#/shared/domain/entity.ts";

interface UserProps extends BaseEntityProps {
  email: string;
  name: string;
}

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

### 3. BaseRepository Interface Implementation

All repositories must implement the `BaseRepository` interface.

**DO:**
```typescript
import { BaseRepository } from "#/shared/domain/repository.ts";

class UserRepository implements BaseRepository<User, CreateUserDTO, UpdateUserDTO> {
  async findById(id: string): Promise<Result<User | null, DomainError>> { /* ... */ }
  async findAll(): Promise<Result<User[], DomainError>> { /* ... */ }
  async create(data: CreateUserDTO): Promise<Result<User, DomainError>> { /* ... */ }
  async update(id: string, data: UpdateUserDTO): Promise<Result<User, DomainError>> { /* ... */ }
  async delete(id: string): Promise<Result<boolean, DomainError>> { /* ... */ }
}
```

### 4. Zod Validation for External Input

All external input must be validated using Zod schemas and the `validate()` helper.

**DO:**
```typescript
import { z } from "zod";
import { validate } from "#/shared/application/validation.ts";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

async function createUser(input: unknown): Promise<Result<User, ValidationError | DatabaseError>> {
  const validationResult = validate(createUserSchema, input);
  if (validationResult.isErr()) {
    return validationResult;
  }
  const data = validationResult.value;
  // Continue with validated data
}
```

---

## Prohibited Patterns

### 1. Throwing Exceptions for Business Logic

**DON'T:**
```typescript
function findUser(id: string): Promise<User> {
  const user = await repository.findById(id);
  if (!user) {
    throw new Error("User not found"); // ❌ Wrong!
  }
  return user;
}
```

**DO:**
```typescript
function findUser(id: string): Promise<Result<User | null, NotFoundError>> {
  const user = await repository.findById(id);
  if (!user) {
    return Result.err(new NotFoundError("User", id));
  }
  return Result.ok(user);
}
```

### 2. Direct Database Access Outside Repositories

**DON'T:**
```typescript
// In application layer
async function getUserEmail(id: string): Promise<string> {
  const row = await db.selectFrom("users").where("id", "=", id).executeTakeFirst(); // ❌ Wrong!
  return row.email;
}
```

**DO:**
```typescript
// In application layer
async function getUserEmail(id: string): Promise<Result<string, DomainError>> {
  const result = await userRepository.findById(id);
  if (result.isErr()) return result;
  if (!result.value) return Result.err(new NotFoundError("User", id));
  return Result.ok(result.value.email);
}
```

### 3. Circular Dependencies Between Features

**DON'T:**
```typescript
// In items feature
import { UserRepository } from "#/features/auth/infrastructure/user.repository.ts";

// AND in auth feature
import { ItemRepository } from "#/features/items/infrastructure/item.repository.ts";
// ❌ Circular dependency!
```

### 4. Domain Layer Depending on Infrastructure

**DON'T:**
```typescript
// In domain/user.entity.ts
import { Kysely } from "kysely"; // ❌ Wrong! Domain should be pure
import { db } from "#/shared/infrastructure/database.ts"; // ❌ Wrong!
```

**DO:**
```typescript
// Domain layer has no infrastructure imports
// Use interfaces defined in domain, implemented in infrastructure
```

---

## Cross-Slice Communication Rules

### When Slice A Needs Data from Slice B

**DON'T:**
```typescript
// In items feature - directly importing from auth
import { UserRepository } from "#/features/auth/infrastructure/user.repository.ts"; // ❌ Wrong!
```

**DO:** Define interface in shared module, implement in source slice:

```typescript
// In src/shared/domain/interfaces/user-lookup.interface.ts
export interface IUserLookup {
  findById(id: string): Promise<Result<UserInfo | null, DomainError>>;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
}

// In auth feature - implement the interface
class UserLookupService implements IUserLookup {
  async findById(id: string): Promise<Result<UserInfo | null, DomainError>> {
    // Implementation using auth's internal repository
  }
}

// In items feature - depend on interface only
class ItemService {
  constructor(private userLookup: IUserLookup) {}
  
  async createItem(userId: string, data: CreateItemDTO) {
    const userResult = await this.userLookup.findById(userId);
    // ...
  }
}
```

### When Slice A Needs to Trigger Action in Slice B

**DON'T:**
```typescript
// Directly calling another slice's application layer
import { notifyUser } from "#/features/auth/application/notify-user.ts"; // ❌ Wrong!
```

**DO:** Use domain events:

```typescript
// In src/shared/domain/events/item-created.event.ts
export interface ItemCreatedEvent {
  itemId: string;
  userId: string;
  createdAt: Date;
}

// In items feature - publish event
eventBus.publish<ItemCreatedEvent>({
  itemId: item.id,
  userId: item.ownerId,
  createdAt: new Date(),
});

// In auth feature - subscribe to event
eventBus.subscribe<ItemCreatedEvent>("ItemCreated", async (event) => {
  await notifyUser(event.userId, `Item ${event.itemId} created`);
});
```

### Anti-Corruption Layer

**DON'T:**
```typescript
// Passing another slice's entity directly
const user: User = await authService.getUser(id); // User is auth's entity
await itemService.setOwner(user); // ❌ Items now depends on auth's domain model
```

**DO:** Create adapter that maps to internal model:

```typescript
// In items feature
interface ItemOwner {
  id: string;
  displayName: string;
}

class UserAdapter {
  toItemOwner(userInfo: UserInfo): ItemOwner {
    return {
      id: userInfo.id,
      displayName: userInfo.name,
    };
  }
}

// Usage
const userInfo = await userLookup.findById(id);
const owner = userAdapter.toItemOwner(userInfo);
await itemService.setOwner(owner);
```

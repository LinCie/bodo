# Code Review Checklist

Use this checklist to ensure consistent quality during code reviews.

## Architecture Compliance

- [ ] Follows vertical slice structure (`domain/`, `application/`,
      `infrastructure/`, `presentation/`)
- [ ] Respects layer boundaries (no forbidden imports)
- [ ] Domain layer has no infrastructure dependencies
- [ ] Uses shared base classes correctly (`BaseEntity`, `BaseRepository`)
- [ ] No circular dependencies between feature slices
- [ ] Cross-slice communication uses shared interfaces (not direct imports)

## Error Handling

- [ ] Uses `Result<T, E>` type for all fallible operations
- [ ] No thrown exceptions for business logic errors
- [ ] Proper error type usage:
  - `NotFoundError` for missing resources
  - `ValidationError` for invalid input
  - `DatabaseError` for data access failures
- [ ] Early returns on errors (`if (result.isErr()) return result;`)
- [ ] Error messages are descriptive and actionable

## Data Access

- [ ] All database access goes through repositories
- [ ] Soft deletion used (sets `deletedAt`, no physical DELETE)
- [ ] Queries filter out soft-deleted records (`WHERE deleted_at IS NULL`)
- [ ] Case mappers used for database row conversion
- [ ] No raw SQL outside infrastructure layer

## Validation

- [ ] All external input validated with Zod schemas
- [ ] Uses `validate()` helper from shared application
- [ ] Validation errors return proper `ValidationError` with details
- [ ] DTOs are separate from domain entities

## Testing

- [ ] Unit tests cover edge cases and error conditions
- [ ] Property-based tests for correctness properties (where applicable)
- [ ] Test annotations follow format:
      `**Feature: {name}, Property {n}: {text}**`
- [ ] Tests don't mock domain logic
- [ ] All tests pass (`deno task test`)

## Code Quality

- [ ] Follows naming conventions:
  - camelCase for variables/functions
  - PascalCase for classes/interfaces
  - kebab-case for file names
  - snake_case for database columns
- [ ] `readonly` used for immutable properties
- [ ] No `any` types (explicit types for public APIs)
- [ ] No TODO comments without issue references

## Documentation

- [ ] Public APIs have JSDoc comments
- [ ] JSDoc includes `@param` and `@returns`
- [ ] Error conditions documented
- [ ] Complex logic has explanatory comments

## Security

- [ ] No sensitive data in logs
- [ ] Input validation prevents injection
- [ ] Proper error messages (no internal details exposed to clients)

## Performance

- [ ] No N+1 query patterns
- [ ] Appropriate use of database indexes (if adding queries)
- [ ] No unnecessary data fetching

---

## Review Response Template

```markdown
## Summary

[Brief description of what was reviewed]

## Findings

### Must Fix

- [ ] [Critical issue that blocks merge]

### Should Fix

- [ ] [Important issue that should be addressed]

### Consider

- [ ] [Suggestion for improvement]

## Approval

- [ ] Approved
- [ ] Approved with comments
- [ ] Changes requested
```

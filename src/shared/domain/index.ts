/**
 * Shared Domain Layer exports
 */

export { Result } from "./result.ts";
export type { Result as ResultType } from "./result.ts";

export { BaseEntity } from "./entity.ts";
export type { BaseEntityProps } from "./entity.ts";

export {
  DomainError,
  NotFoundError,
  ValidationError,
  DatabaseError,
} from "./errors.ts";

export type { BaseRepository } from "./repository.ts";

/**
 * Shared Domain Layer exports
 */

export { Result } from "./result.ts";
export type { Result as ResultType } from "./result.ts";

export { BaseEntity } from "./entity.ts";
export type { BaseEntityProps } from "./entity.ts";

export {
  DatabaseError,
  DomainError,
  NotFoundError,
  ValidationError,
} from "./errors.ts";

export type { BaseRepository } from "./repository.ts";

// Cross-slice communication interfaces
export type {
  IInventoryService,
  InventoryRecord,
  ISpaceLookup,
  ItemForPropagation,
  PropagationResult,
  SpaceInfo,
} from "./interfaces/index.ts";

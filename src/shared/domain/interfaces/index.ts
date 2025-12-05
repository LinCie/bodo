/**
 * Shared domain interfaces for cross-slice communication.
 */

export type {
  IInventoryService,
  InventoryRecord,
  ItemForPropagation,
  PropagationResult,
} from "./inventory-service.interface.ts";

export type { ISpaceLookup, SpaceInfo } from "./space-lookup.interface.ts";

export type { IUserLookup, UserInfo } from "./user-lookup.interface.ts";

export type {
  IAuthUserRepository,
  AuthUser,
  CreateAuthUserDTO,
} from "./auth-user-repository.interface.ts";

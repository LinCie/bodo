/**
 * Interface for user lookup cross-slice communication.
 * Used for querying user information without directly
 * importing from the auth slice.
 *
 * @requirements 7.1
 */

import type { Result } from "../result.ts";
import type { DomainError } from "../errors.ts";

/**
 * Basic user information returned from lookup operations.
 * Excludes sensitive data like password hashes.
 */
export interface UserInfo {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly createdAt: Date;
}

/**
 * Interface for user lookup operations.
 * Enables cross-slice communication for user queries.
 *
 * @requirements 7.1
 */
export interface IUserLookup {
  /**
   * Finds a user by their ID.
   *
   * @param id - The ID of the user to find
   * @returns Result with user info or null if not found
   */
  findById(id: number): Promise<Result<UserInfo | null, DomainError>>;

  /**
   * Finds a user by their email address.
   *
   * @param email - The email address of the user to find
   * @returns Result with user info or null if not found
   */
  findByEmail(email: string): Promise<Result<UserInfo | null, DomainError>>;

  /**
   * Checks if a user exists by their ID.
   *
   * @param id - The ID of the user to check
   * @returns Result with true if user exists, false otherwise
   */
  exists(id: number): Promise<Result<boolean, DomainError>>;
}

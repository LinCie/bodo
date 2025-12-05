/**
 * Interface for auth-specific user repository operations.
 * Used by the auth feature to manage user authentication
 * without directly importing from the users slice.
 */

import type { Result } from "../result.ts";
import type { DomainError } from "../errors.ts";

/**
 * User data required for authentication operations.
 * Includes password hash for credential verification.
 */
export interface AuthUser {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Data for creating a new user during sign-up.
 */
export interface CreateAuthUserDTO {
  name: string;
  email: string;
  password: string; // Already hashed
}

/**
 * Interface for auth-specific user repository operations.
 * Enables the auth feature to manage users without direct
 * dependency on the users slice.
 */
export interface IAuthUserRepository {
  /**
   * Creates a new user.
   *
   * @param data - User creation data with hashed password
   * @returns Result with created user or error
   */
  create(data: CreateAuthUserDTO): Promise<Result<AuthUser, DomainError>>;

  /**
   * Finds a user by their email address.
   *
   * @param email - The email address to search for
   * @returns Result with user or null if not found
   */
  findByEmail(email: string): Promise<Result<AuthUser | null, DomainError>>;

  /**
   * Checks if an email address already exists.
   *
   * @param email - The email address to check
   * @returns Result with true if exists, false otherwise
   */
  emailExists(email: string): Promise<Result<boolean, DomainError>>;
}

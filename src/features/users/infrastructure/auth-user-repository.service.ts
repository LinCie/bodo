/**
 * Auth User Repository Service
 *
 * Implements IAuthUserRepository interface for cross-slice communication.
 * Enables the auth feature to use user operations without direct dependency.
 */

import type { DomainError } from "#/shared/domain/errors.ts";
import type {
  IAuthUserRepository,
  AuthUser,
  CreateAuthUserDTO,
} from "#/shared/domain/interfaces/index.ts";
import { Result } from "#/shared/domain/result.ts";
import type { UserRepository } from "./user.repository.ts";

/**
 * Service that implements IAuthUserRepository using UserRepository.
 * Maps between the users feature's User entity and AuthUser interface.
 */
export class AuthUserRepositoryService implements IAuthUserRepository {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Creates a new user.
   *
   * @param data - User creation data with hashed password
   * @returns Result with created user as AuthUser or error
   */
  async create(data: CreateAuthUserDTO): Promise<Result<AuthUser, DomainError>> {
    const result = await this.userRepository.create(data);

    if (result.isErr()) {
      return result;
    }

    return Result.ok(this.toAuthUser(result.value));
  }

  /**
   * Finds a user by their email address.
   *
   * @param email - The email address to search for
   * @returns Result with user as AuthUser or null if not found
   */
  async findByEmail(email: string): Promise<Result<AuthUser | null, DomainError>> {
    const result = await this.userRepository.findByEmail(email);

    if (result.isErr()) {
      return result;
    }

    if (!result.value) {
      return Result.ok(null);
    }

    return Result.ok(this.toAuthUser(result.value));
  }

  /**
   * Checks if an email address already exists.
   *
   * @param email - The email address to check
   * @returns Result with true if exists, false otherwise
   */
  async emailExists(email: string): Promise<Result<boolean, DomainError>> {
    return await this.userRepository.emailExists(email);
  }

  /**
   * Maps a User entity to AuthUser interface.
   */
  private toAuthUser(user: {
    id: number;
    name: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
  }): AuthUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

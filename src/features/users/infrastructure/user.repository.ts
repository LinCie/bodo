/**
 * User Repository Implementation
 *
 * Implements data access for User entity with Kysely for type-safe SQL queries.
 * Handles user CRUD operations, email lookup, and soft deletion.
 */

import type { Insertable, Kysely, Selectable, Updateable } from "kysely";
import type { DomainError } from "#/shared/domain/errors.ts";
import { DatabaseError, NotFoundError } from "#/shared/domain/errors.ts";
import type { BaseRepository } from "#/shared/domain/repository.ts";
import { Result } from "#/shared/domain/result.ts";
import { User, type UserProps } from "#/features/users/domain/user.entity.ts";
import { mapRowToEntity } from "#/shared/infrastructure/mappers/index.ts";
import type { DB, Users } from "#/shared/infrastructure/persistence/generated.ts";

/**
 * Database row type for users table (from generated types).
 */
type UserRow = Selectable<Users>;

/**
 * Data for creating a new user.
 */
export interface CreateUserDTO {
  name: string;
  email: string;
  password: string; // Already hashed with Argon2
}

/**
 * Data for updating an existing user.
 */
export interface UpdateUserDTO {
  name?: string;
  email?: string;
  password?: string;
}

/**
 * Maps a database row to a User entity.
 * @param row - Database row with snake_case keys
 * @returns User entity instance
 */
function rowToUser(row: UserRow): User {
  const mapped = mapRowToEntity<UserProps>(
    row as unknown as Record<string, unknown>,
  );
  return new User(mapped);
}


/**
 * User repository for data access operations.
 * Implements BaseRepository interface with additional auth-specific methods.
 * Uses Kysely for type-safe SQL queries with Result type for error handling.
 */
export class UserRepository
  implements BaseRepository<User, CreateUserDTO, UpdateUserDTO> {
  private readonly db: Kysely<DB>;

  constructor(db: Kysely<DB>) {
    this.db = db;
  }

  /**
   * Find a user by their unique identifier.
   * Excludes soft-deleted users.
   *
   * @param id - The user's unique identifier
   * @returns Result containing the user if found, null if not found, or an error
   */
  async findById(id: number): Promise<Result<User | null, DomainError>> {
    try {
      const row = await this.db
        .selectFrom("users")
        .selectAll()
        .where("id", "=", id)
        .where("deleted_at", "is", null)
        .executeTakeFirst();

      if (!row) {
        return Result.ok(null);
      }

      return Result.ok(rowToUser(row));
    } catch (error) {
      return Result.err(
        new DatabaseError(
          `Failed to find user by id: ${id}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Find all non-deleted users.
   *
   * @returns Result containing an array of users or an error
   */
  async findAll(): Promise<Result<User[], DomainError>> {
    try {
      const rows = await this.db
        .selectFrom("users")
        .selectAll()
        .where("deleted_at", "is", null)
        .execute();

      const users = rows.map((row) => rowToUser(row));
      return Result.ok(users);
    } catch (error) {
      return Result.err(
        new DatabaseError(
          "Failed to find all users",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Create a new user.
   *
   * @param data - The data for creating the user (password should already be hashed)
   * @returns Result containing the created user or an error
   */
  async create(data: CreateUserDTO): Promise<Result<User, DomainError>> {
    try {
      const now = new Date();
      const insertData: Insertable<Users> = {
        name: data.name,
        email: data.email,
        password: data.password,
        created_at: now,
        updated_at: now,
      };

      const result = await this.db
        .insertInto("users")
        .values(insertData)
        .executeTakeFirstOrThrow();

      const insertedId = Number(result.insertId);

      const userResult = await this.findById(insertedId);
      if (userResult.isErr()) {
        return userResult;
      }

      if (!userResult.value) {
        return Result.err(
          new DatabaseError("Failed to retrieve created user"),
        );
      }

      return Result.ok(userResult.value);
    } catch (error) {
      return Result.err(
        new DatabaseError(
          "Failed to create user",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Update an existing user.
   *
   * @param id - The user's unique identifier
   * @param data - The partial data for updating the user
   * @returns Result containing the updated user or an error
   */
  async update(
    id: number,
    data: UpdateUserDTO,
  ): Promise<Result<User, DomainError>> {
    try {
      const updateData: Updateable<Users> = {
        ...data,
        updated_at: new Date(),
      };

      const result = await this.db
        .updateTable("users")
        .set(updateData)
        .where("id", "=", id)
        .where("deleted_at", "is", null)
        .executeTakeFirst();

      if (result.numUpdatedRows === BigInt(0)) {
        return Result.err(new NotFoundError("User", id));
      }

      const userResult = await this.findById(id);
      if (userResult.isErr()) {
        return userResult;
      }

      if (!userResult.value) {
        return Result.err(new NotFoundError("User", id));
      }

      return Result.ok(userResult.value);
    } catch (error) {
      return Result.err(
        new DatabaseError(
          `Failed to update user: ${id}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Soft delete a user by setting the deletedAt timestamp.
   *
   * @param id - The user's unique identifier
   * @returns Result containing true if deleted successfully, or an error
   */
  async delete(id: number): Promise<Result<boolean, DomainError>> {
    try {
      const result = await this.db
        .updateTable("users")
        .set({ deleted_at: new Date() })
        .where("id", "=", id)
        .where("deleted_at", "is", null)
        .executeTakeFirst();

      if (result.numUpdatedRows === BigInt(0)) {
        return Result.err(new NotFoundError("User", id));
      }

      return Result.ok(true);
    } catch (error) {
      return Result.err(
        new DatabaseError(
          `Failed to delete user: ${id}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Find a user by their email address.
   * Excludes soft-deleted users.
   *
   * @param email - The user's email address
   * @returns Result containing the user if found, null if not found, or an error
   */
  async findByEmail(email: string): Promise<Result<User | null, DomainError>> {
    try {
      const row = await this.db
        .selectFrom("users")
        .selectAll()
        .where("email", "=", email)
        .where("deleted_at", "is", null)
        .executeTakeFirst();

      if (!row) {
        return Result.ok(null);
      }

      return Result.ok(rowToUser(row));
    } catch (error) {
      return Result.err(
        new DatabaseError(
          `Failed to find user by email: ${email}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Check if an email address already exists in the database.
   * Excludes soft-deleted users.
   *
   * @param email - The email address to check
   * @returns Result containing true if email exists, false otherwise, or an error
   */
  async emailExists(email: string): Promise<Result<boolean, DomainError>> {
    try {
      const row = await this.db
        .selectFrom("users")
        .select("id")
        .where("email", "=", email)
        .where("deleted_at", "is", null)
        .executeTakeFirst();

      return Result.ok(row !== undefined);
    } catch (error) {
      return Result.err(
        new DatabaseError(
          `Failed to check email existence: ${email}`,
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }
}

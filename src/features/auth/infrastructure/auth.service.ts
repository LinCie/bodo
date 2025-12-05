/**
 * Auth Service Implementation
 *
 * Handles authentication operations: sign-up, sign-in, token refresh, and sign-out.
 * Coordinates between UserRepository and TokenService for complete auth flows.
 * All methods return Result types for explicit error handling.
 *
 * @requirements 1.1, 2.1, 3.1, 4.1, 7.1
 */

import { hash, verify as argonVerify } from "argon2";
import type { DomainError } from "#/shared/domain/errors.ts";
import { DatabaseError } from "#/shared/domain/errors.ts";
import { Result } from "#/shared/domain/result.ts";
import type { TokenPair } from "#/features/auth/domain/token.types.ts";
import {
  InvalidCredentialsError,
  EmailAlreadyExistsError,
} from "#/features/auth/domain/auth.errors.ts";
import type { SignUpDTO, SignInDTO, RefreshDTO, SignOutDTO } from "#/features/auth/application/auth.dtos.ts";
import type { IAuthUserRepository } from "#/shared/domain/interfaces/index.ts";
import type { ITokenService } from "./token.service.ts";


/**
 * Interface for Auth Service operations.
 */
export interface IAuthService {
  signUp(data: SignUpDTO): Promise<Result<TokenPair, DomainError>>;
  signIn(data: SignInDTO): Promise<Result<TokenPair, DomainError>>;
  refresh(data: RefreshDTO): Promise<Result<TokenPair, DomainError>>;
  signOut(data: SignOutDTO): Promise<Result<boolean, DomainError>>;
}

/**
 * Auth Service for handling authentication operations.
 * Coordinates user management and token operations.
 *
 * @requirements 1.1, 2.1, 3.1, 4.1, 7.1
 */
export class AuthService implements IAuthService {
  private readonly userRepository: IAuthUserRepository;
  private readonly tokenService: ITokenService;

  constructor(userRepository: IAuthUserRepository, tokenService: ITokenService) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
  }

  /**
   * Registers a new user and returns a token pair.
   * Validates email uniqueness and hashes password with Argon2.
   *
   * @param data - Sign-up data (name, email, password)
   * @returns Result containing TokenPair or error
   *
   * @requirements 1.1, 1.4, 1.5
   */
  async signUp(data: SignUpDTO): Promise<Result<TokenPair, DomainError>> {
    try {
      // Check if email already exists
      const emailExistsResult = await this.userRepository.emailExists(data.email);
      if (emailExistsResult.isErr()) {
        return Result.err(emailExistsResult.error);
      }

      if (emailExistsResult.value) {
        return Result.err(new EmailAlreadyExistsError(data.email));
      }

      // Hash password with Argon2
      const hashedPassword = await hash(data.password);

      // Create user with hashed password
      const createResult = await this.userRepository.create({
        name: data.name,
        email: data.email,
        password: hashedPassword,
      });

      if (createResult.isErr()) {
        return Result.err(createResult.error);
      }

      const user = createResult.value;

      // Generate token pair for the new user
      const tokenResult = await this.tokenService.generateTokenPair(user.id);
      if (tokenResult.isErr()) {
        return Result.err(tokenResult.error);
      }

      return Result.ok(tokenResult.value);
    } catch (error) {
      return Result.err(
        new DatabaseError(
          "Failed to sign up user",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }


  /**
   * Authenticates a user with email and password.
   * Verifies credentials and returns a token pair on success.
   *
   * @param data - Sign-in data (email, password)
   * @returns Result containing TokenPair or error
   *
   * @requirements 2.1, 2.2, 2.3, 2.4
   */
  async signIn(data: SignInDTO): Promise<Result<TokenPair, DomainError>> {
    try {
      // Find user by email
      const userResult = await this.userRepository.findByEmail(data.email);
      if (userResult.isErr()) {
        return Result.err(userResult.error);
      }

      const user = userResult.value;
      if (!user) {
        // User not found - return generic error to prevent email enumeration
        return Result.err(new InvalidCredentialsError());
      }

      // Verify password with Argon2
      const isPasswordValid = await argonVerify(user.password, data.password);
      if (!isPasswordValid) {
        return Result.err(new InvalidCredentialsError());
      }

      // Generate token pair for authenticated user
      const tokenResult = await this.tokenService.generateTokenPair(user.id);
      if (tokenResult.isErr()) {
        return Result.err(tokenResult.error);
      }

      return Result.ok(tokenResult.value);
    } catch (error) {
      return Result.err(
        new DatabaseError(
          "Failed to sign in user",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Refreshes a token pair using a valid refresh token.
   * Invalidates the old refresh token and generates a new pair.
   *
   * @param data - Refresh data (refreshToken)
   * @returns Result containing new TokenPair or error
   *
   * @requirements 3.1, 3.2, 3.3, 3.4, 3.5
   */
  async refresh(data: RefreshDTO): Promise<Result<TokenPair, DomainError>> {
    try {
      // Verify the refresh token
      const verifyResult = await this.tokenService.verifyRefreshToken(
        data.refreshToken,
      );
      if (verifyResult.isErr()) {
        return Result.err(verifyResult.error);
      }

      const payload = verifyResult.value;

      // Invalidate the old refresh token (token rotation)
      const invalidateResult = await this.tokenService.invalidateRefreshToken(
        data.refreshToken,
      );
      if (invalidateResult.isErr()) {
        // Log but continue - token might already be invalidated
        // This prevents issues with race conditions
      }

      // Generate new token pair with same session ID for continuity
      const tokenResult = await this.tokenService.generateTokenPair(
        payload.sub,
        payload.jti,
      );
      if (tokenResult.isErr()) {
        return Result.err(tokenResult.error);
      }

      return Result.ok(tokenResult.value);
    } catch (error) {
      return Result.err(
        new DatabaseError(
          "Failed to refresh token",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }


  /**
   * Signs out a user by invalidating their refresh token.
   * Removes the token from Redis to prevent future use.
   *
   * @param data - Sign-out data (refreshToken)
   * @returns Result containing true on success or error
   *
   * @requirements 4.1, 4.2, 4.3
   */
  async signOut(data: SignOutDTO): Promise<Result<boolean, DomainError>> {
    try {
      // Verify the refresh token first
      const verifyResult = await this.tokenService.verifyRefreshToken(
        data.refreshToken,
      );
      if (verifyResult.isErr()) {
        return Result.err(verifyResult.error);
      }

      // Invalidate the refresh token
      const invalidateResult = await this.tokenService.invalidateRefreshToken(
        data.refreshToken,
      );
      if (invalidateResult.isErr()) {
        return Result.err(invalidateResult.error);
      }

      return Result.ok(true);
    } catch (error) {
      return Result.err(
        new DatabaseError(
          "Failed to sign out user",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }
}

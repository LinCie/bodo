/**
 * Token Service Implementation
 *
 * Handles JWT token generation, verification, and Redis storage for refresh tokens.
 * Uses Hono JWT for signing/verification, KSUID for session IDs, and Argon2 for
 * hashing refresh tokens before Redis storage.
 *
 * @requirements 2.4, 3.1, 3.5, 6.1, 6.3
 */

import { sign, verify, decode } from "hono/jwt";
import KSUID from "ksuid";
import { hash, verify as argonVerify } from "argon2";
import type { RedisClient } from "#/shared/infrastructure/persistence/redis.ts";
import { getRedisClient } from "#/shared/infrastructure/persistence/redis.ts";
import type { DomainError } from "#/shared/domain/errors.ts";
import { DatabaseError } from "#/shared/domain/errors.ts";
import { Result } from "#/shared/domain/result.ts";
import type { TokenPayload, TokenPair } from "#/features/auth/domain/token.types.ts";
import {
  TokenExpiredError,
  InvalidTokenError,
} from "#/features/auth/domain/auth.errors.ts";


/**
 * Token expiry constants in seconds.
 */
const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days (604800 seconds)

/**
 * Redis key prefix for refresh tokens.
 * Format: refresh_token:{userId}:{sessionId}
 */
const REFRESH_TOKEN_KEY_PREFIX = "refresh_token";

/**
 * Interface for Token Service operations.
 */
export interface ITokenService {
  generateTokenPair(
    userId: number,
    sessionId?: string,
  ): Promise<Result<TokenPair, DomainError>>;
  verifyAccessToken(token: string): Promise<Result<TokenPayload, DomainError>>;
  verifyRefreshToken(token: string): Promise<Result<TokenPayload, DomainError>>;
  invalidateRefreshToken(token: string): Promise<Result<boolean, DomainError>>;
}

/**
 * Generates a Redis key for storing refresh tokens.
 * @param userId - The user's ID
 * @param sessionId - The session ID (KSUID)
 * @returns Redis key string
 */
function getRefreshTokenKey(userId: number, sessionId: string): string {
  return `${REFRESH_TOKEN_KEY_PREFIX}:${userId}:${sessionId}`;
}

/**
 * Token Service for JWT operations and Redis refresh token storage.
 *
 * @requirements 2.4, 3.1, 3.5, 6.1, 6.3
 */
export class TokenService implements ITokenService {
  private readonly jwtSecret: string;
  private redisClient: RedisClient | null = null;

  constructor(jwtSecret?: string) {
    const secret = jwtSecret ?? Deno.env.get("JWT_SECRET");
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is required");
    }
    this.jwtSecret = secret;
  }

  /**
   * Gets the Redis client, initializing if necessary.
   */
  private async getRedis(): Promise<RedisClient> {
    if (!this.redisClient) {
      this.redisClient = await getRedisClient();
    }
    return this.redisClient;
  }

  /**
   * Generates a new session ID using KSUID.
   * @returns Promise resolving to a KSUID string
   */
  private async generateSessionId(): Promise<string> {
    const ksuid = await KSUID.random();
    return ksuid.string;
  }


  /**
   * Generates a token pair (access + refresh) for a user.
   * Stores the refresh token hash in Redis with TTL.
   *
   * @param userId - The user's ID
   * @param sessionId - Optional session ID (generates new KSUID if not provided)
   * @returns Result containing TokenPair or error
   *
   * @requirements 2.4, 6.1, 6.3
   */
  async generateTokenPair(
    userId: number,
    sessionId?: string,
  ): Promise<Result<TokenPair, DomainError>> {
    try {
      const jti = sessionId ?? (await this.generateSessionId());
      const now = Math.floor(Date.now() / 1000);

      // Create access token payload (15 min expiry)
      const accessPayload = {
        sub: userId,
        jti,
        iat: now,
        exp: now + ACCESS_TOKEN_EXPIRY_SECONDS,
      };

      // Create refresh token payload (7 day expiry)
      const refreshPayload = {
        sub: userId,
        jti,
        iat: now,
        exp: now + REFRESH_TOKEN_EXPIRY_SECONDS,
      };

      // Sign tokens using Hono JWT
      const accessToken = await sign(accessPayload, this.jwtSecret);
      const refreshToken = await sign(refreshPayload, this.jwtSecret);

      // Hash refresh token with Argon2 before storing in Redis
      const refreshTokenHash = await hash(refreshToken);

      // Store in Redis with TTL matching token expiry
      const redis = await this.getRedis();
      const redisKey = getRefreshTokenKey(userId, jti);
      await redis.setEx(redisKey, REFRESH_TOKEN_EXPIRY_SECONDS, refreshTokenHash);

      return Result.ok({
        accessToken,
        refreshToken,
      });
    } catch (error) {
      return Result.err(
        new DatabaseError(
          "Failed to generate token pair",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }


  /**
   * Verifies an access token and returns its payload.
   * Does not check Redis (access tokens are stateless).
   *
   * @param token - The access token to verify
   * @returns Result containing TokenPayload or error
   *
   * @requirements 5.1, 5.2, 5.3
   */
  async verifyAccessToken(
    token: string,
  ): Promise<Result<TokenPayload, DomainError>> {
    try {
      const payload = await verify(token, this.jwtSecret);

      // Check if token has expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return Result.err(new TokenExpiredError("Access token has expired"));
      }

      return Result.ok({
        sub: payload.sub as number,
        jti: payload.jti as string,
        iat: payload.iat as number,
        exp: payload.exp as number,
      });
    } catch (error) {
      // Check if it's an expiration error
      if (error instanceof Error && error.message.includes("expired")) {
        return Result.err(new TokenExpiredError("Access token has expired"));
      }
      return Result.err(new InvalidTokenError("Invalid access token"));
    }
  }

  /**
   * Verifies a refresh token against Redis storage.
   * Checks both JWT validity and Redis existence.
   *
   * @param token - The refresh token to verify
   * @returns Result containing TokenPayload or error
   *
   * @requirements 3.1, 3.2, 3.3, 3.4, 6.2
   */
  async verifyRefreshToken(
    token: string,
  ): Promise<Result<TokenPayload, DomainError>> {
    try {
      // First verify JWT signature and decode
      const payload = await verify(token, this.jwtSecret);

      // Check if token has expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return Result.err(new TokenExpiredError("Refresh token has expired"));
      }

      const userId = payload.sub as number;
      const sessionId = payload.jti as string;

      // Check if token exists in Redis
      const redis = await this.getRedis();
      const redisKey = getRefreshTokenKey(userId, sessionId);
      const storedHash = await redis.get(redisKey);

      if (!storedHash) {
        return Result.err(
          new InvalidTokenError("Refresh token not found or already revoked"),
        );
      }

      // Verify the token against stored Argon2 hash
      const isValid = await argonVerify(storedHash, token);
      if (!isValid) {
        return Result.err(new InvalidTokenError("Refresh token mismatch"));
      }

      return Result.ok({
        sub: userId,
        jti: sessionId,
        iat: payload.iat as number,
        exp: payload.exp as number,
      });
    } catch (error) {
      if (error instanceof TokenExpiredError || error instanceof InvalidTokenError) {
        return Result.err(error);
      }
      if (error instanceof Error && error.message.includes("expired")) {
        return Result.err(new TokenExpiredError("Refresh token has expired"));
      }
      return Result.err(new InvalidTokenError("Invalid refresh token"));
    }
  }


  /**
   * Invalidates a refresh token by removing it from Redis.
   * Used for sign-out and token rotation.
   *
   * @param token - The refresh token to invalidate
   * @returns Result containing true if invalidated, or error
   *
   * @requirements 3.5, 4.1, 4.3
   */
  async invalidateRefreshToken(
    token: string,
  ): Promise<Result<boolean, DomainError>> {
    try {
      // Decode token to get userId and sessionId (without full verification)
      const { payload } = decode(token);

      if (!payload || typeof payload.sub !== "number" || typeof payload.jti !== "string") {
        return Result.err(new InvalidTokenError("Invalid token format"));
      }

      const userId = payload.sub;
      const sessionId = payload.jti;

      // Remove from Redis
      const redis = await this.getRedis();
      const redisKey = getRefreshTokenKey(userId, sessionId);
      const deleted = await redis.del(redisKey);

      if (deleted === 0) {
        return Result.err(
          new InvalidTokenError("Refresh token not found or already invalidated"),
        );
      }

      return Result.ok(true);
    } catch (error) {
      if (error instanceof InvalidTokenError) {
        return Result.err(error);
      }
      return Result.err(
        new DatabaseError(
          "Failed to invalidate refresh token",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }
}

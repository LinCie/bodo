/**
 * Auth Middleware for protecting routes.
 *
 * Extracts Bearer token from Authorization header, validates it,
 * and attaches the user ID to the Hono context for downstream handlers.
 */

import { createMiddleware } from "hono/factory";
import type { ITokenService } from "#/features/auth/infrastructure/token.service.ts";
import {
  TokenExpiredError,
  InvalidTokenError,
} from "#/features/auth/domain/auth.errors.ts";

/**
 * Environment type for auth middleware context variables.
 */
export type AuthEnv = {
  Variables: {
    userId: number;
  };
};

/**
 * Error response structure for auth failures.
 */
interface AuthErrorResponse {
  code: string;
  message: string;
}

/**
 * Creates an auth middleware with the provided token service.
 * Validates Bearer tokens and attaches userId to context.
 *
 * @param tokenService - The token service for verifying access tokens
 * @returns Hono middleware handler
 */
export function createAuthMiddleware(tokenService: ITokenService) {
  return createMiddleware<AuthEnv>(async (c, next) => {
    // Get Authorization header
    const authHeader = c.req.header("Authorization");

    // Check if Authorization header exists (Requirement 5.4)
    if (!authHeader) {
      const response: AuthErrorResponse = {
        code: "UNAUTHORIZED",
        message: "Authorization header is required",
      };
      return c.json(response, 401);
    }

    // Validate "Bearer <token>" format (Requirement 5.5)
    if (!authHeader.startsWith("Bearer ")) {
      const response: AuthErrorResponse = {
        code: "UNAUTHORIZED",
        message: "Invalid authorization header format. Expected: Bearer <token>",
      };
      return c.json(response, 401);
    }

    // Extract token from header
    const token = authHeader.slice(7); // Remove "Bearer " prefix

    if (!token) {
      const response: AuthErrorResponse = {
        code: "UNAUTHORIZED",
        message: "Token is required",
      };
      return c.json(response, 401);
    }

    // Verify access token (Requirements 5.1, 5.2, 5.3)
    const verifyResult = await tokenService.verifyAccessToken(token);

    if (verifyResult.isErr()) {
      const error = verifyResult.error;
      let response: AuthErrorResponse;

      if (error instanceof TokenExpiredError) {
        // Requirement 5.2: Expired token
        response = {
          code: "TOKEN_EXPIRED",
          message: error.message,
        };
      } else if (error instanceof InvalidTokenError) {
        // Requirement 5.3: Invalid signature
        response = {
          code: "INVALID_TOKEN",
          message: error.message,
        };
      } else {
        response = {
          code: "UNAUTHORIZED",
          message: "Authentication failed",
        };
      }

      return c.json(response, 401);
    }

    // Extract user ID from token payload and attach to context (Requirement 5.1)
    const payload = verifyResult.value;
    c.set("userId", payload.sub);

    await next();
  });
}

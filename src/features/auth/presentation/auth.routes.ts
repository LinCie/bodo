/**
 * Hono routes for Auth module.
 * Exposes HTTP endpoints for authentication operations.
 *
 * @requirements 1.1, 2.1, 3.1, 4.1
 */

import { Hono } from "hono";
import { validate } from "#/shared/application/validation.ts";
import { errorToResponse, errorToStatus } from "#/shared/presentation/index.ts";
import type { IAuthService } from "#/features/auth/infrastructure/auth.service.ts";
import {
  signUpSchema,
  signInSchema,
  refreshSchema,
  signOutSchema,
} from "#/features/auth/application/auth.schemas.ts";

/**
 * Dependencies required for auth routes.
 */
export interface AuthRoutesDependencies {
  authService: IAuthService;
}

/**
 * Creates Hono routes for authentication with injected dependencies.
 * @param deps - Dependencies for the routes
 * @returns Hono app with auth routes
 */
export function createAuthRoutes(deps: AuthRoutesDependencies): Hono {
  const { authService } = deps;
  const app = new Hono();

  /**
   * POST /auth/signup - Register a new user
   * Creates a new user account and returns a token pair.
   */
  app.post("/signup", async (c) => {
    // Validate request body
    const body = await c.req.json();
    const validationResult = validate(signUpSchema, body);

    if (validationResult.isErr()) {
      const error = validationResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    // Call auth service to sign up
    const signUpResult = await authService.signUp(validationResult.value);

    if (signUpResult.isErr()) {
      const error = signUpResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    // Return token pair
    return c.json({
      data: {
        accessToken: signUpResult.value.accessToken,
        refreshToken: signUpResult.value.refreshToken,
      },
    }, 201);
  });


  /**
   * POST /auth/signin - Authenticate a user
   * Validates credentials and returns a token pair.
   */
  app.post("/signin", async (c) => {
    // Validate request body
    const body = await c.req.json();
    const validationResult = validate(signInSchema, body);

    if (validationResult.isErr()) {
      const error = validationResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    // Call auth service to sign in
    const signInResult = await authService.signIn(validationResult.value);

    if (signInResult.isErr()) {
      const error = signInResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    // Return token pair
    return c.json({
      data: {
        accessToken: signInResult.value.accessToken,
        refreshToken: signInResult.value.refreshToken,
      },
    });
  });

  /**
   * POST /auth/refresh - Refresh token pair
   * Validates refresh token and returns a new token pair.
   */
  app.post("/refresh", async (c) => {
    // Validate request body
    const body = await c.req.json();
    const validationResult = validate(refreshSchema, body);

    if (validationResult.isErr()) {
      const error = validationResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    // Call auth service to refresh tokens
    const refreshResult = await authService.refresh(validationResult.value);

    if (refreshResult.isErr()) {
      const error = refreshResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    // Return new token pair
    return c.json({
      data: {
        accessToken: refreshResult.value.accessToken,
        refreshToken: refreshResult.value.refreshToken,
      },
    });
  });

  /**
   * POST /auth/signout - Sign out user
   * Invalidates the refresh token.
   */
  app.post("/signout", async (c) => {
    // Validate request body
    const body = await c.req.json();
    const validationResult = validate(signOutSchema, body);

    if (validationResult.isErr()) {
      const error = validationResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    // Call auth service to sign out
    const signOutResult = await authService.signOut(validationResult.value);

    if (signOutResult.isErr()) {
      const error = signOutResult.error;
      return c.json(errorToResponse(error), errorToStatus(error));
    }

    // Return success response
    return c.json({
      data: {
        success: true,
        message: "Successfully signed out",
      },
    });
  });

  return app;
}

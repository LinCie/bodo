/**
 * Auth Feature Module
 *
 * Self-contained module that initializes its own dependencies
 * and exports routes ready for mounting.
 */

import { authUserRepository } from "#/features/users/index.ts";
import { TokenService } from "./infrastructure/token.service.ts";
import { AuthService } from "./infrastructure/auth.service.ts";
import { createAuthRoutes } from "./presentation/auth.routes.ts";
import { createAuthMiddleware } from "./presentation/auth.middleware.ts";

// Initialize module dependencies
const tokenService = new TokenService();
const authService = new AuthService(authUserRepository, tokenService);

// Export routes for mounting
export const authRoutes = createAuthRoutes({ authService });

// Export middleware for protecting routes in other features
export const authMiddleware = createAuthMiddleware(tokenService);

// Re-export types for use in other features
export type { AuthEnv } from "./presentation/auth.middleware.ts";

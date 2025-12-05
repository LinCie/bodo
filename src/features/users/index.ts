/**
 * Users Feature Module
 *
 * Self-contained module that initializes its own dependencies
 * and exports services for cross-slice communication.
 */

import { getDatabase } from "#/shared/infrastructure/persistence/index.ts";
import { UserRepository } from "./infrastructure/user.repository.ts";
import { AuthUserRepositoryService } from "./infrastructure/auth-user-repository.service.ts";

// Initialize module dependencies
const db = getDatabase();
const userRepository = new UserRepository(db);

// Export services for cross-slice communication
export const authUserRepository = new AuthUserRepositoryService(userRepository);

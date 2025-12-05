/**
 * Persistence module exports.
 */

export { createDatabase, type Database, getDatabase } from "./database.ts";

export {
  closeRedisClient,
  createRedisClient,
  getRedisClient,
  type RedisClient,
} from "./redis.ts";

// Re-export all generated types for convenience
export type * from "./generated.ts";

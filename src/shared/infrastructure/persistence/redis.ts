/**
 * Redis Client Configuration
 *
 * Sets up a Redis client singleton for the Deno + Hono application.
 * Used for refresh token storage with TTL support.
 * Follows the same singleton pattern as database.ts.
 */

import { createClient, type RedisClientType } from "redis";
import { logger } from "#/shared/infrastructure/logger/index.ts";

/**
 * Redis client type export for type-safe usage across the application.
 */
export type RedisClient = RedisClientType;

/**
 * Creates a Redis client instance with connection configuration.
 * Uses REDIS_URL environment variable for connection string.
 *
 * @returns Promise resolving to connected Redis client
 * @throws Error if REDIS_URL environment variable is not set
 */
export async function createRedisClient(): Promise<RedisClient> {
  const redisUrl = Deno.env.get("REDIS_URL");

  if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is required");
  }

  const client = createClient({
    url: redisUrl,
  });

  // Set up event listeners for connection lifecycle
  client.on("error", (err) => {
    logger.error({ err }, "Redis client error");
  });

  client.on("connect", () => {
    logger.info("Connecting to Redis...");
  });

  client.on("ready", () => {
    logger.info("Redis client ready");
  });

  client.on("reconnecting", () => {
    logger.warn("Reconnecting to Redis...");
  });

  client.on("end", () => {
    logger.info("Redis connection closed");
  });

  await client.connect();

  return client as RedisClient;
}

/**
 * Global Redis client instance.
 * Lazily initialized on first access.
 */
let _redisClient: RedisClient | null = null;

/**
 * Gets the global Redis client instance.
 * Creates and connects the instance if it doesn't exist.
 *
 * @returns Promise resolving to Redis client instance
 */
export async function getRedisClient(): Promise<RedisClient> {
  if (!_redisClient) {
    _redisClient = await createRedisClient();
  }
  return _redisClient;
}

/**
 * Closes the Redis client connection.
 * Useful for graceful shutdown.
 */
export async function closeRedisClient(): Promise<void> {
  if (_redisClient) {
    await _redisClient.quit();
    _redisClient = null;
    logger.info("Redis client disconnected");
  }
}

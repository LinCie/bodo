/**
 * Database Configuration
 *
 * Sets up Kysely with MySQL dialect for the Deno + Hono application.
 * Uses mysql2 driver with connection pooling.
 * All types are imported from the Kysely codegen generated file.
 */

import { Kysely, MysqlDialect, MysqlPool } from "kysely";
import { createPool } from "mysql2";
import type { DB } from "#/shared/infrastructure/persistence/generated.ts";

/**
 * Re-export DB type as Database for backward compatibility.
 * All database types come from generated.ts (Kysely codegen).
 */
export type Database = DB;

/**
 * Creates a Kysely database instance with MySQL dialect.
 * Uses environment variables for database connection configuration.
 *
 * @returns Kysely database instance
 */
export function createDatabase(): Kysely<Database> {
  const databaseUrl = Deno.env.get("DATABASE_URL");

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  // Create pool - use type assertion to handle mysql2/Kysely type compatibility
  const pool = createPool(databaseUrl) as unknown as MysqlPool;

  const dialect = new MysqlDialect({
    pool,
  });

  return new Kysely<Database>({
    dialect,
  });
}

/**
 * Global database instance.
 * Lazily initialized on first access.
 */
let _db: Kysely<Database> | null = null;

/**
 * Gets the global database instance.
 * Creates the instance if it doesn't exist.
 *
 * @returns Kysely database instance
 */
export function getDatabase(): Kysely<Database> {
  if (!_db) {
    _db = createDatabase();
  }
  return _db;
}

/**
 * Persistence module exports.
 */

export { createDatabase, type Database, getDatabase } from "./database.ts";

// Re-export all generated types for convenience
export type * from "./generated.ts";

/**
 * Service Locator
 *
 * Simple service registry for cross-feature dependency resolution.
 * Features register their shared services here, and other features
 * can resolve them when needed.
 */

// deno-lint-ignore no-explicit-any
const services = new Map<string, any>();

/**
 * Registers a service instance with the locator.
 *
 * @param key - Unique identifier for the service
 * @param instance - The service instance
 */
export function registerService<T>(key: string, instance: T): void {
  if (services.has(key)) {
    throw new Error(`Service "${key}" is already registered`);
  }
  services.set(key, instance);
}

/**
 * Resolves a service by its key.
 * Throws if the service is not registered.
 *
 * @param key - Unique identifier for the service
 * @returns The service instance
 */
export function resolveService<T>(key: string): T {
  const service = services.get(key);
  if (!service) {
    throw new Error(`Service "${key}" is not registered`);
  }
  return service as T;
}

/**
 * Checks if a service is registered.
 *
 * @param key - Unique identifier for the service
 * @returns True if registered
 */
export function hasService(key: string): boolean {
  return services.has(key);
}

/**
 * Clears all registered services.
 * Useful for testing.
 */
export function clearServices(): void {
  services.clear();
}

/**
 * Well-known service keys for type-safe resolution.
 */
export const ServiceKeys = {
  INVENTORY_SERVICE: "inventoryService",
} as const;

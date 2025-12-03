/**
 * Domain error types for type-safe error handling.
 * All domain errors extend the base DomainError class.
 */

export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract override readonly message: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND";
  readonly message: string;

  constructor(
    readonly resource: string,
    readonly id: string
  ) {
    const message = `${resource} with id '${id}' not found`;
    super(message);
    this.message = message;
  }
}

export class ValidationError extends DomainError {
  readonly code = "VALIDATION_ERROR";

  constructor(
    readonly message: string,
    readonly details: Record<string, string[]>
  ) {
    super(message);
  }
}

export class DatabaseError extends DomainError {
  readonly code = "DATABASE_ERROR";

  constructor(
    readonly message: string,
    override readonly cause?: Error
  ) {
    super(message);
  }
}

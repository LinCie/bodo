/**
 * Auth-specific domain errors.
 * Extends shared DomainError for authentication-related error handling.
 */

import { DomainError } from "#/shared/domain/errors.ts";

/**
 * Base authentication error for general auth failures.
 */
export class AuthenticationError extends DomainError {
  readonly code = "AUTHENTICATION_ERROR";

  constructor(readonly message: string = "Authentication failed") {
    super(message);
  }
}

/**
 * Error thrown when credentials (email/password) are invalid.
 * Used for sign-in failures due to wrong password or non-existent email.
 */
export class InvalidCredentialsError extends DomainError {
  readonly code = "INVALID_CREDENTIALS";

  constructor(
    readonly message: string = "Invalid email or password",
  ) {
    super(message);
  }
}

/**
 * Error thrown when a token has expired.
 * Used for both access and refresh token expiration.
 */
export class TokenExpiredError extends DomainError {
  readonly code = "TOKEN_EXPIRED";

  constructor(readonly message: string = "Token has expired") {
    super(message);
  }
}

/**
 * Error thrown when a token is invalid (malformed, wrong signature, etc.).
 * Used for JWT verification failures.
 */
export class InvalidTokenError extends DomainError {
  readonly code = "INVALID_TOKEN";

  constructor(readonly message: string = "Invalid token") {
    super(message);
  }
}

/**
 * Error thrown when attempting to register with an email that already exists.
 * Used during sign-up to prevent duplicate accounts.
 */
export class EmailAlreadyExistsError extends DomainError {
  readonly code = "EMAIL_ALREADY_EXISTS";
  override readonly message: string;

  constructor(readonly email: string) {
    const message = `Email '${email}' is already registered`;
    super(message);
    this.message = message;
  }
}

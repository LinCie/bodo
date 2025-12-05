/**
 * Token-related type definitions for JWT authentication.
 */

/**
 * JWT token payload structure.
 * Contains claims for user identification and session management.
 */
export interface TokenPayload {
  /** User ID (subject claim) */
  sub: number;
  /** Session ID using KSUID (JWT ID claim) */
  jti: string;
  /** Expiration timestamp in seconds (expiration claim) */
  exp: number;
  /** Issued at timestamp in seconds (issued at claim) */
  iat: number;
}

/**
 * Pair of access and refresh tokens returned on authentication.
 */
export interface TokenPair {
  /** Short-lived JWT for API authorization (15 minutes) */
  accessToken: string;
  /** Longer-lived JWT for session refresh (7 days) */
  refreshToken: string;
}

/**
 * Token type discriminator for access vs refresh tokens.
 */
export type TokenType = "access" | "refresh";

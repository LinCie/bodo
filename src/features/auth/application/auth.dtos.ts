/**
 * Data Transfer Objects for Auth module.
 * Defines types for transferring authentication data between layers.
 *
 * @requirements 7.1
 */

/**
 * DTO for user registration.
 * Contains required fields for creating a new user account.
 */
export interface SignUpDTO {
  name: string;
  email: string;
  password: string;
}

/**
 * DTO for user sign-in.
 * Contains credentials for authentication.
 */
export interface SignInDTO {
  email: string;
  password: string;
}

/**
 * DTO for token refresh.
 * Contains the refresh token to exchange for a new token pair.
 */
export interface RefreshDTO {
  refreshToken: string;
}

/**
 * DTO for user sign-out.
 * Contains the refresh token to invalidate.
 */
export interface SignOutDTO {
  refreshToken: string;
}

/**
 * DTO for authentication response.
 * Contains the token pair returned on successful authentication.
 */
export interface AuthResponseDTO {
  accessToken: string;
  refreshToken: string;
}

/**
 * DTO for user response data.
 * Represents user data returned from API endpoints (excludes password).
 */
export interface UserResponseDTO {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

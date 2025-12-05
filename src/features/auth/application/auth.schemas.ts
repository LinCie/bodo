/**
 * Zod validation schemas for Auth module.
 * Defines schemas for registration, sign-in, token refresh, and sign-out.
 *
 * @requirements 1.2, 1.3, 7.4
 */

import { z } from "zod";

/**
 * Schema for user registration.
 * Validates name, email format, and password minimum length.
 *
 * @requirements 1.2, 1.3
 */
export const signUpSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
});

/**
 * Schema for user sign-in.
 * Validates email format and password minimum length.
 *
 * @requirements 1.2, 1.3
 */
export const signInSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Schema for token refresh.
 * Validates refresh token is provided.
 */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

/**
 * Schema for user sign-out.
 * Validates refresh token is provided.
 */
export const signOutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

/**
 * Inferred types from schemas for use in application layer.
 */
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type SignOutInput = z.infer<typeof signOutSchema>;

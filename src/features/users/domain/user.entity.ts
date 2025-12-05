/**
 * User domain entity representing an authenticated user.
 * Extends BaseEntity with user-specific properties.
 */

import { BaseEntity, BaseEntityProps } from "#/shared/domain/entity.ts";

/**
 * Properties required to construct a User entity.
 */
export interface UserProps extends BaseEntityProps {
  name: string;
  email: string;
  password: string; // Argon2 hashed
}

/**
 * User entity representing an authenticated user in the system.
 * Contains identity and credential information.
 */
export class User extends BaseEntity {
  readonly name: string;
  readonly email: string;
  readonly password: string;

  constructor(props: UserProps) {
    super(props);
    this.name = props.name;
    this.email = props.email;
    this.password = props.password;
  }
}

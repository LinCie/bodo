/**
 * Base entity class providing common identity and audit properties.
 * All domain entities should extend this abstract class.
 */

export interface BaseEntityProps {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export abstract class BaseEntity {
  readonly id: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  constructor(props: BaseEntityProps) {
    this.id = props.id;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.deletedAt = props.deletedAt;
  }

  equals(other: BaseEntity): boolean {
    return this.id === other.id;
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}

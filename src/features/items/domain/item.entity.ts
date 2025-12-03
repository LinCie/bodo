/**
 * Item domain entity representing a product or inventory item.
 * Extends BaseEntity with all item-specific properties.
 */

import { BaseEntity, BaseEntityProps } from "#/shared/domain/entity.ts";

/**
 * Valid status values for an item.
 */
export type ItemStatus = "active" | "inactive" | "archived";

/**
 * Properties required to construct an Item entity.
 */
export interface ItemProps extends BaseEntityProps {
  name: string;
  code: string | null;
  sku: string | null;
  primaryCode: string | null;
  description: string | null;
  notes: string | null;
  price: string | null;
  cost: string | null;
  weight: string | null;
  status: ItemStatus;
  spaceId: number | null;
  spaceType: string | null;
  parentId: number | null;
  parentType: string | null;
  modelId: number | null;
  modelType: string | null;
  typeId: number | null;
  typeType: string | null;
  images: unknown | null;
  files: unknown | null;
  links: unknown | null;
  tags: unknown | null;
  attributes: unknown | null;
  options: unknown | null;
  variants: unknown | null;
  dimension: unknown | null;
}

/**
 * Item entity representing a product or inventory item.
 * Contains all properties for tracking inventory and product information.
 */
export class Item extends BaseEntity {
  readonly name: string;
  readonly code: string | null;
  readonly sku: string | null;
  readonly primaryCode: string | null;
  readonly description: string | null;
  readonly notes: string | null;
  readonly price: string | null;
  readonly cost: string | null;
  readonly weight: string | null;
  readonly status: ItemStatus;
  readonly spaceId: number | null;
  readonly spaceType: string | null;
  readonly parentId: number | null;
  readonly parentType: string | null;
  readonly modelId: number | null;
  readonly modelType: string | null;
  readonly typeId: number | null;
  readonly typeType: string | null;
  readonly images: unknown | null;
  readonly files: unknown | null;
  readonly links: unknown | null;
  readonly tags: unknown | null;
  readonly attributes: unknown | null;
  readonly options: unknown | null;
  readonly variants: unknown | null;
  readonly dimension: unknown | null;

  constructor(props: ItemProps) {
    super(props);
    this.name = props.name;
    this.code = props.code;
    this.sku = props.sku;
    this.primaryCode = props.primaryCode;
    this.description = props.description;
    this.notes = props.notes;
    this.price = props.price;
    this.cost = props.cost;
    this.weight = props.weight;
    this.status = props.status;
    this.spaceId = props.spaceId;
    this.spaceType = props.spaceType;
    this.parentId = props.parentId;
    this.parentType = props.parentType;
    this.modelId = props.modelId;
    this.modelType = props.modelType;
    this.typeId = props.typeId;
    this.typeType = props.typeType;
    this.images = props.images;
    this.files = props.files;
    this.links = props.links;
    this.tags = props.tags;
    this.attributes = props.attributes;
    this.options = props.options;
    this.variants = props.variants;
    this.dimension = props.dimension;
  }

  /**
   * Checks if the item is active.
   * @returns true if status is "active"
   */
  isActive(): boolean {
    return this.status === "active";
  }

  /**
   * Checks if the item is archived (soft-deleted).
   * @returns true if status is "archived"
   */
  isArchived(): boolean {
    return this.status === "archived";
  }
}

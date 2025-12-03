/**
 * Inventory domain entity representing item quantities within a specific space.
 * Extends BaseEntity with all inventory-specific properties.
 */

import { BaseEntity, BaseEntityProps } from "#/shared/domain/entity.ts";

/**
 * Properties required to construct an Inventory entity.
 * Based on the inventories table schema from the design document.
 */
export interface InventoryProps extends BaseEntityProps {
  itemId: number;
  itemType: string | null;
  spaceId: number;
  spaceType: string | null;
  name: string | null;
  code: string | null;
  sku: string | null;
  balance: string;
  costPerUnit: string | null;
  status: string | null;
  notes: string | null;
  modelType: string | null;
  parentType: string | null;
}

/**
 * Inventory entity representing item quantities and costs within a specific space.
 * Tracks inventory records for items across the space hierarchy.
 */
export class Inventory extends BaseEntity {
  readonly itemId: number;
  readonly itemType: string | null;
  readonly spaceId: number;
  readonly spaceType: string | null;
  readonly name: string | null;
  readonly code: string | null;
  readonly sku: string | null;
  readonly balance: string;
  readonly costPerUnit: string | null;
  readonly status: string | null;
  readonly notes: string | null;
  readonly modelType: string | null;
  readonly parentType: string | null;

  constructor(props: InventoryProps) {
    super(props);
    this.itemId = props.itemId;
    this.itemType = props.itemType;
    this.spaceId = props.spaceId;
    this.spaceType = props.spaceType;
    this.name = props.name;
    this.code = props.code;
    this.sku = props.sku;
    this.balance = props.balance;
    this.costPerUnit = props.costPerUnit;
    this.status = props.status;
    this.notes = props.notes;
    this.modelType = props.modelType;
    this.parentType = props.parentType;
  }

  /**
   * Checks if the inventory has a positive balance.
   * @returns true if balance is greater than zero
   */
  hasStock(): boolean {
    const balanceNum = parseFloat(this.balance);
    return !isNaN(balanceNum) && balanceNum > 0;
  }
}

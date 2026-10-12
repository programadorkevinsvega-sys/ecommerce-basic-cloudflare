export type ShippingZoneType = 'national' | 'department' | 'city' | 'municipality';

export interface ShippingZoneProps {
  id: string;
  name: string;
  type: ShippingZoneType;
  priceInCents: number;
  minEstimatedDays: number;
  maxEstimatedDays: number;
  allowsCashOnDelivery: boolean;
  isActive: boolean;
  locations?: string[];
  createdAt: string;
  updatedAt: string;
}

export class ShippingZone {
  public readonly id: string;
  public name: string;
  public type: ShippingZoneType;
  public priceInCents: number;
  public minEstimatedDays: number;
  public maxEstimatedDays: number;
  public allowsCashOnDelivery: boolean;
  public isActive: boolean;
  public locations: string[];
  public readonly createdAt: string;
  public updatedAt: string;

  constructor(props: ShippingZoneProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('ShippingZone id is required');
    }
    if (!props.name || props.name.trim() === '') {
      throw new Error('ShippingZone name is required');
    }
    if (props.priceInCents < 0) {
      throw new Error('Price in cents cannot be negative');
    }
    if (props.minEstimatedDays < 0 || props.maxEstimatedDays < props.minEstimatedDays) {
      throw new Error('Invalid estimated days range');
    }

    this.id = props.id.trim();
    this.name = props.name.trim();
    this.type = props.type;
    this.priceInCents = Math.round(props.priceInCents);
    this.minEstimatedDays = Math.round(props.minEstimatedDays);
    this.maxEstimatedDays = Math.round(props.maxEstimatedDays);
    this.allowsCashOnDelivery = Boolean(props.allowsCashOnDelivery);
    this.isActive = Boolean(props.isActive);
    this.locations = props.locations ? [...new Set(props.locations)] : [];
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public coversDaneCode(daneCode: string): boolean {
    if (!this.isActive) return false;
    if (this.type === 'national') return true;
    return this.locations.includes(daneCode);
  }

  public update(props: {
    name?: string;
    type?: ShippingZoneType;
    priceInCents?: number;
    minEstimatedDays?: number;
    maxEstimatedDays?: number;
    allowsCashOnDelivery?: boolean;
    isActive?: boolean;
    locations?: string[];
    updatedAt?: string;
  }): void {
    if (props.name !== undefined) {
      if (!props.name.trim()) throw new Error('ShippingZone name cannot be empty');
      this.name = props.name.trim();
    }
    if (props.type !== undefined) {
      this.type = props.type;
    }
    if (props.priceInCents !== undefined) {
      if (props.priceInCents < 0) throw new Error('Price in cents cannot be negative');
      this.priceInCents = Math.round(props.priceInCents);
    }
    if (props.minEstimatedDays !== undefined) {
      if (props.minEstimatedDays < 0) throw new Error('minEstimatedDays cannot be negative');
      this.minEstimatedDays = Math.round(props.minEstimatedDays);
    }
    if (props.maxEstimatedDays !== undefined) {
      if (props.maxEstimatedDays < this.minEstimatedDays) throw new Error('maxEstimatedDays cannot be less than min');
      this.maxEstimatedDays = Math.round(props.maxEstimatedDays);
    }
    if (props.allowsCashOnDelivery !== undefined) {
      this.allowsCashOnDelivery = Boolean(props.allowsCashOnDelivery);
    }
    if (props.isActive !== undefined) {
      this.isActive = Boolean(props.isActive);
    }
    if (props.locations !== undefined) {
      this.locations = [...new Set(props.locations)];
    }
    this.updatedAt = props.updatedAt || new Date().toISOString();
  }

  public toggleActive(): void {
    this.isActive = !this.isActive;
    this.updatedAt = new Date().toISOString();
  }

  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      priceInCents: this.priceInCents,
      minEstimatedDays: this.minEstimatedDays,
      maxEstimatedDays: this.maxEstimatedDays,
      allowsCashOnDelivery: this.allowsCashOnDelivery,
      isActive: this.isActive,
      locations: this.locations,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

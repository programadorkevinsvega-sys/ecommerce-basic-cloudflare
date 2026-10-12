import { ShippingZone } from '../entities/ShippingZone.js';

export interface IShippingZoneRepository {
  save(zone: ShippingZone): Promise<void>;
  findById(id: string): Promise<ShippingZone | null>;
  listAll(onlyActive?: boolean): Promise<ShippingZone[]>;
  findByDaneCode(daneCode: string): Promise<ShippingZone[]>;
  delete(id: string): Promise<void>;
}

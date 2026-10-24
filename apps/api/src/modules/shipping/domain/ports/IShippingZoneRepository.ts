import { ShippingZone } from '../entities/ShippingZone.js';

export interface IShippingZoneRepository {
  save(zone: ShippingZone): Promise<void>;
  findById(id: string): Promise<ShippingZone | null>;
  listAll(onlyActive?: boolean, limit?: number, offset?: number, localOnly?: boolean): Promise<ShippingZone[]>;
  count?(onlyActive?: boolean, localOnly?: boolean): Promise<number>;
  findByDaneCode(daneCode: string): Promise<ShippingZone[]>;
  delete(id: string): Promise<void>;
}

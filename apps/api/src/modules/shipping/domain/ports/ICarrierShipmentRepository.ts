import { CarrierShipment, CarrierShipmentPatch } from '../entities/CarrierShipment.js';

export interface ICarrierShipmentRepository {
  findByOrderId(orderId: string): Promise<CarrierShipment | null>;
  findById(id: string): Promise<CarrierShipment | null>;
  createPending(input: { id: string; orderId: string; collectionValueCents: number; requestHash: string; now: string }): Promise<boolean>;
  update(id: string, patch: CarrierShipmentPatch, now: string): Promise<void>;
  addEvent(input: { id: string; shipmentId: string; eventKey: string; providerStatus: string; status: string; occurredAt: string }): Promise<boolean>;
  list(input: { limit: number; offset: number; status?: string; unprinted?: boolean }): Promise<{ items: CarrierShipment[]; total: number }>;
  listPendingSync(limit: number): Promise<CarrierShipment[]>;
}

import { CarrierShipment } from '../../domain/entities/CarrierShipment.js';
import { ICarrierShipmentRepository } from '../../domain/ports/ICarrierShipmentRepository.js';
import { IShippingCarrierPort } from '../ports/out/IShippingCarrierPort.js';
import { ReconcilePendingMiPaqueteShipmentUseCase } from './ReconcilePendingMiPaqueteShipmentUseCase.js';

export class SyncMiPaqueteShipmentUseCase {
  private readonly repository: ICarrierShipmentRepository;
  private readonly carrier: IShippingCarrierPort;
  private readonly reconcilePending: ReconcilePendingMiPaqueteShipmentUseCase;
  public constructor(repository: ICarrierShipmentRepository, carrier: IShippingCarrierPort, reconcilePending: ReconcilePendingMiPaqueteShipmentUseCase) {
    this.repository = repository; this.carrier = carrier; this.reconcilePending = reconcilePending;
  }

  public async execute(id: string): Promise<CarrierShipment | null> {
    let shipment = await this.repository.findById(id);
    if (shipment?.status === 'creation_pending') shipment = await this.reconcilePending.execute(shipment);
    if (!shipment?.mipaqueteCode) return shipment;
    const status = await this.carrier.getStatus(shipment.mipaqueteCode);
    if (!status) return shipment;
    const normalized = normalizeStatus(status.status);
    const now = new Date().toISOString();
    await this.repository.update(id, {
      guideNumber: status.guideNumber, guideUrl: status.guideUrls[0] || shipment.guideUrl,
      carrierName: status.carrierName, providerStatus: status.status,
      status: normalized, lastSyncedAt: now,
    }, now);
    for (const event of status.tracking) {
      const occurredAt = event.occurredAt || now;
      const eventKey = `${shipment.mipaqueteCode}:${occurredAt}:${event.status}`;
      await this.repository.addEvent({ id: crypto.randomUUID(), shipmentId: id, eventKey,
        providerStatus: event.status, status: normalizeStatus(event.status), occurredAt });
    }
    return this.repository.findById(id);
  }
}

function normalizeStatus(value: string): CarrierShipment['status'] {
  const status = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (status.includes('entreg')) return 'delivered';
  if (status.includes('cancel') || status.includes('anulad')) return 'cancelled';
  if (status.includes('novedad') || status.includes('devol') || status.includes('fall')) return 'exception';
  if (status.includes('transit') || status.includes('ruta') || status.includes('despach')) return 'in_transit';
  return 'created';
}

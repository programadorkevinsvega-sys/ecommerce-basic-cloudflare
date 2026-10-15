import { CarrierShipment } from '../../domain/entities/CarrierShipment.js';
import { ICarrierShipmentRepository } from '../../domain/ports/ICarrierShipmentRepository.js';
import { IShippingCarrierPort } from '../ports/out/IShippingCarrierPort.js';

export class ReconcilePendingMiPaqueteShipmentUseCase {
  private readonly repository: ICarrierShipmentRepository;
  private readonly carrier: IShippingCarrierPort;
  public constructor(repository: ICarrierShipmentRepository, carrier: IShippingCarrierPort) {
    this.repository = repository; this.carrier = carrier;
  }
  public async execute(shipment: CarrierShipment): Promise<CarrierShipment> {
    const result = await this.carrier.findByOrderReference(shipment.orderId, shipment.createdAt);
    const now = new Date().toISOString();
    if (result.kind !== 'found') {
      const detail = result.kind === 'not_found' ? 'No aparece en la consulta exhaustiva; se conserva el bloqueo.'
        : result.kind === 'multiple' ? 'Hay varias coincidencias; requiere revisión.' : 'Consulta acotada; requiere nueva conciliación.';
      await this.repository.update(shipment.id, { providerStatus: detail, lastSyncedAt: now }, now);
      return (await this.repository.findById(shipment.id)) as CarrierShipment;
    }
    await this.repository.update(shipment.id, {
      providerShipmentId: result.providerShipmentId, mipaqueteCode: result.mipaqueteCode,
      guideNumber: result.guideNumber, guideUrl: result.guideUrls[0] || null,
      pickupCode: result.pickupCode, carrierName: result.carrierName,
      providerStatus: result.status, status: normalizeStatus(result.status), lastSyncedAt: now,
    }, now);
    return (await this.repository.findById(shipment.id)) as CarrierShipment;
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

import { CarrierShipment } from '../../domain/entities/CarrierShipment.js';
import { ICarrierShipmentRepository } from '../../domain/ports/ICarrierShipmentRepository.js';
import { SyncMiPaqueteShipmentUseCase } from './SyncMiPaqueteShipmentUseCase.js';

export class SyncPendingMiPaqueteShipmentsUseCase {
  private readonly repository: ICarrierShipmentRepository;
  private readonly syncOne: SyncMiPaqueteShipmentUseCase;
  public constructor(repository: ICarrierShipmentRepository, syncOne: SyncMiPaqueteShipmentUseCase) {
    this.repository = repository; this.syncOne = syncOne;
  }
  public async execute(limit = 10): Promise<CarrierShipment[]> {
    const pending = await this.repository.listPendingSync(Math.min(20, Math.max(1, limit)));
    const results: CarrierShipment[] = [];
    for (const shipment of pending) {
      try { const updated = await this.syncOne.execute(shipment.id); if (updated) results.push(updated); }
      catch { /* El próximo cron reintentará consultas autenticadas que fallaron. */ }
    }
    return results;
  }
}

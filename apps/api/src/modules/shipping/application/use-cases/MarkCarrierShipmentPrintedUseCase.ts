import { CarrierShipment } from '../../domain/entities/CarrierShipment.js';
import { ICarrierShipmentRepository } from '../../domain/ports/ICarrierShipmentRepository.js';

export class MarkCarrierShipmentPrintedUseCase {
  private readonly repository: ICarrierShipmentRepository;
  public constructor(repository: ICarrierShipmentRepository) { this.repository = repository; }
  public async execute(id: string, actorId: string): Promise<CarrierShipment | null> {
    const shipment = await this.repository.findById(id);
    if (!shipment || !shipment.guideUrl) return null;
    if (!shipment.printedAt) await this.repository.update(id, { printedAt: new Date().toISOString(), printedBy: actorId }, new Date().toISOString());
    return this.repository.findById(id);
  }
}

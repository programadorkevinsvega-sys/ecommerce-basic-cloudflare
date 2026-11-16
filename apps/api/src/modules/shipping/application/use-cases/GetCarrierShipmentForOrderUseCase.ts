import { CarrierShipment } from '../../domain/entities/CarrierShipment.js';
import { ICarrierShipmentRepository } from '../../domain/ports/ICarrierShipmentRepository.js';

export class GetCarrierShipmentForOrderUseCase {
  public constructor(private readonly repository: ICarrierShipmentRepository) {}

  public execute(orderId: string): Promise<CarrierShipment | null> {
    return this.repository.findByOrderId(orderId);
  }
}

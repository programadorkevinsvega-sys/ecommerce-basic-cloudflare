import { CarrierShipment } from '../../domain/entities/CarrierShipment.js';
import { ICarrierShipmentRepository } from '../../domain/ports/ICarrierShipmentRepository.js';

export class ListCarrierShipmentsUseCase {
  private readonly repository: ICarrierShipmentRepository;
  public constructor(repository: ICarrierShipmentRepository) { this.repository = repository; }
  public execute(input: { page: number; pageSize: number; unprinted?: boolean }): Promise<{ items: CarrierShipment[]; total: number }> {
    return this.repository.list({ limit: input.pageSize, offset: (input.page - 1) * input.pageSize, unprinted: input.unprinted });
  }
}

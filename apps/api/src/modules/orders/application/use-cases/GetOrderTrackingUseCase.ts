import { IOrderTrackingRepository, OrderTrackingRecord } from '../../domain/ports/IOrderTrackingRepository.js';

export class GetOrderTrackingUseCase {
  private readonly repository: IOrderTrackingRepository;

  public constructor(repository: IOrderTrackingRepository) {
    this.repository = repository;
  }

  public execute(orderId: string, tokenHash: string): Promise<OrderTrackingRecord | null> {
    return this.repository.findByCapability(orderId, tokenHash);
  }
}

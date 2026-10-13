import { IInventoryRepository } from '../../domain/ports/IInventoryRepository.js';

export class CheckActiveReservationUseCase {
  public constructor(private readonly repository: IInventoryRepository) {}

  public execute(orderId: string, items: Array<{ productId: string; quantity: number }>): Promise<boolean> {
    return this.repository.hasActiveReservation(orderId, items);
  }
}

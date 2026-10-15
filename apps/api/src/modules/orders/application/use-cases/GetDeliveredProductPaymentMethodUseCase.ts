import { IOrderRepository } from '../../domain/ports/IOrderRepository.js';

export class GetDeliveredProductPaymentMethodUseCase {
  public constructor(private readonly repository: IOrderRepository) {}

  public execute(customerId: string, productId: string): Promise<'wompi' | 'cash_on_delivery' | null> {
    return this.repository.getDeliveredProductPaymentMethod(customerId, productId);
  }
}

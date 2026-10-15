import { ICarrierQuoteRepository } from '../../domain/ports/ICarrierQuoteRepository.js';

export class LinkCarrierQuoteToOrderUseCase {
  private readonly repository: ICarrierQuoteRepository;
  public constructor(repository: ICarrierQuoteRepository) { this.repository = repository; }
  public execute(quoteId: string, orderId: string): Promise<boolean> {
    return this.repository.linkToOrder(quoteId, orderId, new Date().toISOString());
  }
}

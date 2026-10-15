import { CarrierShippingQuote } from '../../domain/entities/CarrierShippingQuote.js';
import { ICarrierQuoteRepository } from '../../domain/ports/ICarrierQuoteRepository.js';

export class GetCarrierQuoteForOrderUseCase {
  private readonly repository: ICarrierQuoteRepository;
  public constructor(repository: ICarrierQuoteRepository) { this.repository = repository; }
  public execute(orderId: string): Promise<CarrierShippingQuote | null> { return this.repository.findByOrderId(orderId); }
}

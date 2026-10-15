import { CarrierShippingQuote } from '../../domain/entities/CarrierShippingQuote.js';
import { ICarrierQuoteRepository } from '../../domain/ports/ICarrierQuoteRepository.js';

export class GetAvailableCarrierQuoteUseCase {
  private readonly repository: ICarrierQuoteRepository;
  public constructor(repository: ICarrierQuoteRepository) { this.repository = repository; }
  public execute(id: string, method: 'wompi' | 'cash_on_delivery', daneCode: string): Promise<CarrierShippingQuote | null> {
    return this.repository.findAvailable(id, method, daneCode, new Date().toISOString());
  }
}

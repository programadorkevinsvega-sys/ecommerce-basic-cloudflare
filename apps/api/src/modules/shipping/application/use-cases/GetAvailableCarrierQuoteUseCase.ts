import { CarrierShippingQuote } from '../../domain/entities/CarrierShippingQuote.js';
import { ICarrierQuoteRepository } from '../../domain/ports/ICarrierQuoteRepository.js';
import { PackedOrderItem } from '../../domain/services/PackOrderIntoConfiguredBox.js';
import { createCarrierPackageFingerprint } from '../services/CreateCarrierPackageFingerprint.js';

export class GetAvailableCarrierQuoteUseCase {
  private readonly repository: ICarrierQuoteRepository;
  public constructor(repository: ICarrierQuoteRepository) { this.repository = repository; }
  public async execute(input: { id: string; method: 'wompi' | 'cash_on_delivery'; shippingChargeMode?: 'included' | 'collect_at_delivery'; daneCode: string; items: PackedOrderItem[]; declaredValueCents: number; saleValueCents: number }): Promise<CarrierShippingQuote | null> {
    const fingerprint = await createCarrierPackageFingerprint({ ...input, paymentMethod: input.method });
    return this.repository.findAvailable(input.id, input.method, input.daneCode, fingerprint, new Date().toISOString());
  }
}

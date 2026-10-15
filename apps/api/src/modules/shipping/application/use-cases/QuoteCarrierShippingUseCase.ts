import { CarrierIntegrationConfig } from '../../domain/entities/CarrierIntegrationConfig.js';
import { CarrierShippingQuote } from '../../domain/entities/CarrierShippingQuote.js';
import { ICarrierConfigRepository } from '../../domain/ports/ICarrierConfigRepository.js';
import { ICarrierQuoteRepository } from '../../domain/ports/ICarrierQuoteRepository.js';
import { IShippingCarrierPort } from '../ports/out/IShippingCarrierPort.js';
import { PackedOrderItem, packOrderIntoConfiguredBox } from '../../domain/services/PackOrderIntoConfiguredBox.js';
import { createCarrierPackageFingerprint } from '../services/CreateCarrierPackageFingerprint.js';

export class QuoteCarrierShippingUseCase {
  private readonly config: ICarrierConfigRepository;
  private readonly quotes: ICarrierQuoteRepository;
  private readonly carrier: IShippingCarrierPort;
  public constructor(config: ICarrierConfigRepository, quotes: ICarrierQuoteRepository, carrier: IShippingCarrierPort) {
    this.config = config; this.quotes = quotes; this.carrier = carrier;
  }

  public async execute(input: { destinationDaneCode: string; paymentMethod: 'wompi' | 'cash_on_delivery'; declaredValueCents: number; saleValueCents: number; items: PackedOrderItem[] }): Promise<CarrierShippingQuote[]> {
    const setup = await this.config.get();
    assertConfigured(setup);
    if (!setup.enabled) throw new Error('Carrier integration is disabled');
    if (!/^\d{8}$/.test(input.destinationDaneCode) || !isMoney(input.declaredValueCents) || !isMoney(input.saleValueCents)) {
      throw new Error('Invalid carrier quote input');
    }
    const parcel = packOrderIntoConfiguredBox(input.items, setup.packageProfiles);
    if (!parcel) throw new Error('Los productos no caben en las cajas configuradas. Se requiere embalaje manual.');
    const packageFingerprint = await createCarrierPackageFingerprint(input);
    const options = await this.carrier.quote({
      originDaneCode: setup.originDaneCode as string, destinationDaneCode: input.destinationDaneCode,
      widthCm: parcel.widthCm, lengthCm: parcel.lengthCm,
      heightCm: parcel.heightCm, weightKg: parcel.weightKg,
      quantity: 1, declaredValueCop: Math.ceil(input.declaredValueCents / 100),
      saleValueCop: Math.ceil(input.saleValueCents / 100), cashOnDelivery: input.paymentMethod === 'cash_on_delivery',
    });
    const now = new Date();
    const expiry = new Date(now.getTime() + 10 * 60_000).toISOString();
    const stored = options.map((option) => ({
      id: crypto.randomUUID(), providerQuoteId: option.quoteId, deliveryCompanyId: option.deliveryCompanyId,
      deliveryCompanyName: option.deliveryCompanyName, shippingCostCents: option.shippingCostCop * 100,
      collectionCommissionCents: option.collectionCommissionCop * 100, deliveryMinutes: option.deliveryMinutes,
      paymentMethod: input.paymentMethod, destinationDaneCode: input.destinationDaneCode,
      declaredValueCents: input.declaredValueCents, saleValueCents: input.saleValueCents,
      packageProfileId: parcel.profileId, packageWidthCm: parcel.widthCm,
      packageLengthCm: parcel.lengthCm, packageHeightCm: parcel.heightCm,
      packageWeightGrams: parcel.weightGrams, packageWeightKg: parcel.weightKg,
      packageFingerprint,
      status: 'available' as const, orderId: null, expiresAt: expiry, createdAt: now.toISOString(),
    }));
    await this.quotes.saveMany(stored);
    return stored;
  }
}

function assertConfigured(config: CarrierIntegrationConfig): void {
  if (!config.originDaneCode || !config.packageProfiles.some((profile) => profile.isActive)) {
    throw new Error('Carrier setup incomplete');
  }
}

function isMoney(value: number): boolean { return Number.isSafeInteger(value) && value >= 0; }

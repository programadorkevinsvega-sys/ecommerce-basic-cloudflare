import { CarrierIntegrationConfig } from '../../domain/entities/CarrierIntegrationConfig.js';
import { ICarrierConfigRepository } from '../../domain/ports/ICarrierConfigRepository.js';

export class UpdateCarrierConfigUseCase {
  private readonly repository: ICarrierConfigRepository;
  public constructor(repository: ICarrierConfigRepository) { this.repository = repository; }

  public async execute(input: CarrierIntegrationConfig): Promise<CarrierIntegrationConfig> {
    if (typeof input.enabled !== 'boolean') throw new Error('Estado de integración inválido');
    if (!/^\d{8}$/.test(input.originDaneCode || '')) throw new Error('Código DANE de origen inválido');
    if (!Array.isArray(input.packageProfiles) || input.packageProfiles.length > 20) throw new Error('Configura hasta 20 tipos de empaque.');
    for (const profile of input.packageProfiles) {
      const dims = [profile.innerWidthCm, profile.innerLengthCm, profile.innerHeightCm,
        profile.outerWidthCm, profile.outerLengthCm, profile.outerHeightCm];
      if (!profile.id || !profile.name.trim() || dims.some((v) => !Number.isSafeInteger(v) || v < 1 || v > 300) ||
          profile.innerWidthCm > profile.outerWidthCm || profile.innerLengthCm > profile.outerLengthCm ||
          profile.innerHeightCm > profile.outerHeightCm || !Number.isSafeInteger(profile.tareWeightGrams) ||
          profile.tareWeightGrams < 0 || !Number.isSafeInteger(profile.maxWeightGrams) ||
          profile.maxWeightGrams <= profile.tareWeightGrams || profile.maxWeightGrams > 1_000_000) {
        throw new Error('Revisa dimensiones internas/externas y capacidad de los empaques.');
      }
    }
    if (input.enabled && !input.packageProfiles.some((profile) => profile.isActive)) throw new Error('Agrega al menos un empaque activo antes de habilitar cotizaciones.');
    if (!['cost', 'sale_value'].includes(input.declaredValueMode || '')) throw new Error('Modo de valor declarado inválido');
    if (![101, 102].includes(input.cashOnDeliveryPaymentType || 0)) throw new Error('Forma de pago del flete inválida');
    if (typeof input.requestPickup !== 'boolean') throw new Error('Debe indicar si solicita recolección');
    if (!['price', 'time', 'score'].includes(input.selectionCriterion || '')) throw new Error('Criterio de transportadora inválido');
    return this.repository.save({ ...input, updatedAt: new Date().toISOString() });
  }
}

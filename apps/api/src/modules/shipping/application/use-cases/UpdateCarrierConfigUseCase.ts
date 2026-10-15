import { CarrierIntegrationConfig } from '../../domain/entities/CarrierIntegrationConfig.js';
import { ICarrierConfigRepository } from '../../domain/ports/ICarrierConfigRepository.js';

export class UpdateCarrierConfigUseCase {
  private readonly repository: ICarrierConfigRepository;
  public constructor(repository: ICarrierConfigRepository) { this.repository = repository; }

  public async execute(input: CarrierIntegrationConfig): Promise<CarrierIntegrationConfig> {
    if (typeof input.enabled !== 'boolean') throw new Error('Estado de integración inválido');
    if (!/^\d{8}$/.test(input.originDaneCode || '')) throw new Error('Código DANE de origen inválido');
    for (const value of [input.packageWidthCm, input.packageLengthCm, input.packageHeightCm, input.packageWeightKg]) {
      if (!Number.isSafeInteger(value) || (value as number) < 1 || (value as number) > 1000) {
        throw new Error('Dimensiones y peso deben ser enteros positivos');
      }
    }
    if (!['cost', 'sale_value'].includes(input.declaredValueMode || '')) throw new Error('Modo de valor declarado inválido');
    if (![101, 102].includes(input.cashOnDeliveryPaymentType || 0)) throw new Error('Forma de pago del flete inválida');
    if (typeof input.requestPickup !== 'boolean') throw new Error('Debe indicar si solicita recolección');
    if (!['price', 'time', 'score'].includes(input.selectionCriterion || '')) throw new Error('Criterio de transportadora inválido');
    return this.repository.save({ ...input, updatedAt: new Date().toISOString() });
  }
}

import { CarrierIntegrationConfig } from '../../domain/entities/CarrierIntegrationConfig.js';
import { ICarrierConfigRepository } from '../../domain/ports/ICarrierConfigRepository.js';

export class GetCarrierConfigUseCase {
  private readonly repository: ICarrierConfigRepository;
  public constructor(repository: ICarrierConfigRepository) { this.repository = repository; }
  public execute(): Promise<CarrierIntegrationConfig> { return this.repository.get(); }
}

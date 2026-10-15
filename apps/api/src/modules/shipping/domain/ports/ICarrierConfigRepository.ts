import { CarrierIntegrationConfig } from '../entities/CarrierIntegrationConfig.js';

export interface ICarrierConfigRepository {
  get(): Promise<CarrierIntegrationConfig>;
  save(config: CarrierIntegrationConfig): Promise<CarrierIntegrationConfig>;
}

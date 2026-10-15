import { CarrierIntegrationConfig } from '../entities/CarrierIntegrationConfig.js';
import { CarrierPackageProfile, CarrierPackageProfileInput } from '../entities/CarrierPackageProfile.js';

export interface ICarrierConfigRepository {
  get(): Promise<CarrierIntegrationConfig>;
  save(config: CarrierIntegrationConfig): Promise<CarrierIntegrationConfig>;
  listProfiles(): Promise<CarrierPackageProfile[]>;
  getProfile(id: string): Promise<CarrierPackageProfile | null>;
  createProfile(profile: CarrierPackageProfile): Promise<void>;
  updateProfile(id: string, profile: CarrierPackageProfileInput, updatedAt: string): Promise<CarrierPackageProfile | null>;
  setProfileActive(id: string, active: boolean, updatedAt: string): Promise<CarrierPackageProfile | null>;
  deleteProfile(id: string): Promise<boolean>;
}

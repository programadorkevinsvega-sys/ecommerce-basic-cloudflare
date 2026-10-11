import { StoreSettings } from '../entities/StoreSettings.js';

export interface ISettingsRepository {
  get(): Promise<StoreSettings | null>;
  save(settings: StoreSettings): Promise<void>;
}

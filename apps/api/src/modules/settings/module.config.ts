import { Env } from '../../platform/Env.js';
import { D1SettingsRepository } from './infrastructure/persistence/d1/repositories/D1SettingsRepository.js';
import { GetStoreSettingsUseCase } from './application/use-cases/GetStoreSettingsUseCase.js';
import { UpdateStoreSettingsUseCase } from './application/use-cases/UpdateStoreSettingsUseCase.js';

export interface SettingsModuleContainer {
  getStoreSettingsUseCase: GetStoreSettingsUseCase;
  updateStoreSettingsUseCase: UpdateStoreSettingsUseCase;
}

export function createSettingsModule(env: Env): SettingsModuleContainer {
  const repository = new D1SettingsRepository(env.DB);
  const getStoreSettingsUseCase = new GetStoreSettingsUseCase(repository);
  const updateStoreSettingsUseCase = new UpdateStoreSettingsUseCase(repository);

  return {
    getStoreSettingsUseCase,
    updateStoreSettingsUseCase,
  };
}

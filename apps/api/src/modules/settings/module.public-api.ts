import { StoreSettingsDTO } from './application/dto/StoreSettingsDTO.js';
import { UpdateStoreSettingsDTO } from './application/dto/UpdateStoreSettingsDTO.js';
import { SettingsModuleContainer } from './module.config.js';

export interface ISettingsPublicApi {
  getStoreSettings(): Promise<StoreSettingsDTO>;
  updateStoreSettings(dto: UpdateStoreSettingsDTO): Promise<StoreSettingsDTO>;
}

export class SettingsPublicApi implements ISettingsPublicApi {
  private readonly container: SettingsModuleContainer;

  public constructor(container: SettingsModuleContainer) {
    this.container = container;
  }

  public async getStoreSettings(): Promise<StoreSettingsDTO> {
    const result = await this.container.getStoreSettingsUseCase.execute();
    if (result.isFail()) {
      throw result.error;
    }
    return result.value;
  }

  public async updateStoreSettings(dto: UpdateStoreSettingsDTO): Promise<StoreSettingsDTO> {
    const result = await this.container.updateStoreSettingsUseCase.execute(dto);
    if (result.isFail()) {
      throw result.error;
    }
    return result.value;
  }
}

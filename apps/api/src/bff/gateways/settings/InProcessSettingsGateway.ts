import { SettingsGateway, StoreSettingsResponse, UpdateStoreSettingsRequest } from './SettingsGateway.js';
import { ISettingsPublicApi } from '../../../modules/settings/module.public-api.js';

export class InProcessSettingsGateway implements SettingsGateway {
  private readonly publicApi: ISettingsPublicApi;

  public constructor(publicApi: ISettingsPublicApi) {
    this.publicApi = publicApi;
  }

  public async getSettings(): Promise<StoreSettingsResponse> {
    return this.publicApi.getStoreSettings();
  }

  public async updateSettings(request: UpdateStoreSettingsRequest): Promise<StoreSettingsResponse> {
    return this.publicApi.updateStoreSettings(request);
  }
}

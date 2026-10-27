import { ICatalogPublicApi } from '../../../modules/catalog/module.public-api.js';
import { ProductLandingGateway, SaveProductLandingConfigRequest } from './ProductLandingGateway.js';

export class InProcessProductLandingGateway implements ProductLandingGateway {
  public constructor(private readonly publicApi: ICatalogPublicApi) {}

  public async getProductLandingConfig(productId: string) {
    const config = await this.publicApi.getProductLandingConfig(productId);
    return config?.toPrimitives() ?? null;
  }

  public async saveProductLandingConfig(input: SaveProductLandingConfigRequest) {
    return (await this.publicApi.saveProductLandingConfig(input)).toPrimitives();
  }
}

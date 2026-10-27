import { ProductLandingConfig } from '../entities/ProductLandingConfig.js';

export interface IProductLandingConfigRepository {
  findByProductId(productId: string): Promise<ProductLandingConfig | null>;
  save(config: ProductLandingConfig): Promise<void>;
}

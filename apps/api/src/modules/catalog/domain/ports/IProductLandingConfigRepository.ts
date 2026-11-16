import { ProductLandingConfig } from '../entities/ProductLandingConfig.js';

export interface IProductLandingConfigRepository {
  findByProductId(productId: string): Promise<ProductLandingConfig | null>;
  listIndexable(): Promise<Array<{ slug: string; updatedAt: string }>>;
  save(config: ProductLandingConfig): Promise<void>;
}

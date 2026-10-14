import { ProductVariant } from '../entities/ProductVariant.js';

export interface IProductVariantRepository {
  save(variant: ProductVariant): Promise<void>;
  list(): Promise<ProductVariant[]>;
}

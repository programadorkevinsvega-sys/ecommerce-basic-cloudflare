import { ProductTag, SaveProductTagInput } from '../entities/ProductTag.js';

export interface IProductTagRepository {
  list(includeInactive?: boolean): Promise<ProductTag[]>;
  save(input: SaveProductTagInput): Promise<ProductTag>;
  delete(id: string): Promise<void>;
}

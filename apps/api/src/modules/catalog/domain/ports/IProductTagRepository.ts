import { ProductTag, SaveProductTagInput } from '../entities/ProductTag.js';

export interface IProductTagRepository {
  list(includeInactive?: boolean, page?: number, pageSize?: number): Promise<ProductTag[]>;
  count(includeInactive?: boolean): Promise<number>;
  save(input: SaveProductTagInput): Promise<ProductTag>;
  delete(id: string): Promise<void>;
}

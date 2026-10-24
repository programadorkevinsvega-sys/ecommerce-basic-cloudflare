import { Attribute } from '../entities/Attribute.js';
import { CatalogPageQuery } from './CatalogPageQuery.js';

export interface IAttributeRepository {
  findById(id: string): Promise<Attribute | null>;
  findByCode(code: string): Promise<Attribute | null>;
  save(attribute: Attribute): Promise<void>;
  delete(id: string): Promise<void>;
  list(query?: CatalogPageQuery): Promise<Attribute[]>;
  count(includeInactive?: boolean): Promise<number>;
}

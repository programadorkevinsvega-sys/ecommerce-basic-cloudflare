import { Collection } from '../entities/Collection.js';
import { CatalogPageQuery } from './CatalogPageQuery.js';

export interface ICollectionRepository {
  findById(id: string): Promise<Collection | null>;
  findBySlug(slug: string): Promise<Collection | null>;
  save(collection: Collection): Promise<void>;
  delete(id: string): Promise<void>;
  list(query?: CatalogPageQuery): Promise<Collection[]>;
  count(includeInactive?: boolean, query?: string): Promise<number>;
}

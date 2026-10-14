import { Supplier } from '../entities/Supplier.js';
import { CatalogPageQuery } from './CatalogPageQuery.js';

export interface ISupplierRepository {
  findById(id: string): Promise<Supplier | null>;
  save(supplier: Supplier): Promise<void>;
  delete(id: string): Promise<void>;
  list(query?: CatalogPageQuery): Promise<Supplier[]>;
}

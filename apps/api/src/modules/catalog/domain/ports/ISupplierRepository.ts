import { Supplier } from '../entities/Supplier.js';

export interface ISupplierRepository {
  save(supplier: Supplier): Promise<void>;
  list(): Promise<Supplier[]>;
}

import { Supplier } from '../../domain/entities/Supplier.js';
import { ISupplierRepository } from '../../domain/ports/ISupplierRepository.js';
import { CatalogPageQuery } from '../../domain/ports/CatalogPageQuery.js';

export class ListSuppliersUseCase {
  public constructor(private readonly suppliers: ISupplierRepository) {}
  public execute(query?: CatalogPageQuery): Promise<Supplier[]> { return this.suppliers.list(query); }
}

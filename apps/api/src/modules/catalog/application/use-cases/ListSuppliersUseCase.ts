import { Supplier } from '../../domain/entities/Supplier.js';
import { ISupplierRepository } from '../../domain/ports/ISupplierRepository.js';

export class ListSuppliersUseCase {
  public constructor(private readonly suppliers: ISupplierRepository) {}
  public execute(): Promise<Supplier[]> { return this.suppliers.list(); }
}

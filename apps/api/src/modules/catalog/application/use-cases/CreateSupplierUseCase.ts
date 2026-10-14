import { Supplier, SupplierProps } from '../../domain/entities/Supplier.js';
import { ISupplierRepository } from '../../domain/ports/ISupplierRepository.js';

export type CreateSupplierInput = Omit<SupplierProps, 'id' | 'createdAt' | 'updatedAt'>;

export class CreateSupplierUseCase {
  public constructor(private readonly suppliers: ISupplierRepository) {}
  public async execute(input: CreateSupplierInput): Promise<Supplier> {
    const now = new Date().toISOString();
    const supplier = new Supplier({ ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now });
    await this.suppliers.save(supplier);
    return supplier;
  }
}

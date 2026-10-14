import { Result } from '../../../../shared-kernel/Result.js';
import { Brand } from '../../domain/entities/Brand.js';
import { IBrandRepository } from '../../domain/ports/IBrandRepository.js';

export class UpdateBrandDescriptionUseCase {
  public constructor(private readonly brands: IBrandRepository) {}

  public async execute(id: string, description: string): Promise<Result<Brand, Error>> {
    try {
      const current = await this.brands.findById(id);
      if (!current) return Result.fail(new Error('Marca no encontrada'));
      const updated = new Brand({ ...current.toPrimitives(), description: description.trim(), updatedAt: new Date().toISOString() });
      await this.brands.save(updated);
      return Result.ok(updated);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('No fue posible actualizar la marca'));
    }
  }
}

import { Result } from '../../../../shared-kernel/Result.js';
import { ICategoryRepository } from '../../domain/ports/ICategoryRepository.js';

export class DeleteCategoryUseCase {
  private readonly categoryRepo: ICategoryRepository;

  public constructor(categoryRepo: ICategoryRepository) {
    this.categoryRepo = categoryRepo;
  }

  public async execute(id: string): Promise<Result<void, Error>> {
    const existing = await this.categoryRepo.findById(id);
    if (!existing) {
      return Result.fail(new Error('Categoría no encontrada'));
    }

    try {
      await this.categoryRepo.delete(id);
      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al eliminar categoría'));
    }
  }
}

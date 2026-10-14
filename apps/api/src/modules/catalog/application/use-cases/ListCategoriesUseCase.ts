import { Result } from '../../../../shared-kernel/Result.js';
import { Category } from '../../domain/entities/Category.js';
import { ICategoryRepository } from '../../domain/ports/ICategoryRepository.js';
import { CatalogPageQuery } from '../../domain/ports/CatalogPageQuery.js';

export class ListCategoriesUseCase {
  private readonly categoryRepo: ICategoryRepository;

  public constructor(categoryRepo: ICategoryRepository) {
    this.categoryRepo = categoryRepo;
  }

  public async execute(query?: CatalogPageQuery): Promise<Result<Category[], Error>> {
    try {
      const categories = await this.categoryRepo.list(query);
      return Result.ok(categories);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al listar categorías'));
    }
  }
}

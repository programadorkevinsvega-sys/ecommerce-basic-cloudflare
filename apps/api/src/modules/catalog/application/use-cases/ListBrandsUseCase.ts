import { Result } from '../../../../shared-kernel/Result.js';
import { Brand } from '../../domain/entities/Brand.js';
import { IBrandRepository } from '../../domain/ports/IBrandRepository.js';
import { CatalogPageQuery } from '../../domain/ports/CatalogPageQuery.js';

export class ListBrandsUseCase {
  private readonly brandRepo: IBrandRepository;

  public constructor(brandRepo: IBrandRepository) {
    this.brandRepo = brandRepo;
  }

  public async execute(query?: CatalogPageQuery): Promise<Result<Brand[], Error>> {
    try {
      const brands = await this.brandRepo.list(query);
      return Result.ok(brands);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al listar marcas'));
    }
  }
}

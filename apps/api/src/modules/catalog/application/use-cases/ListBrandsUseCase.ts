import { Result } from '../../../../shared-kernel/Result.js';
import { Brand } from '../../domain/entities/Brand.js';
import { IBrandRepository } from '../../domain/ports/IBrandRepository.js';

export class ListBrandsUseCase {
  private readonly brandRepo: IBrandRepository;

  public constructor(brandRepo: IBrandRepository) {
    this.brandRepo = brandRepo;
  }

  public async execute(): Promise<Result<Brand[], Error>> {
    try {
      const brands = await this.brandRepo.list();
      return Result.ok(brands);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al listar marcas'));
    }
  }
}

import { Result } from '../../../../shared-kernel/Result.js';
import { IProductRepository } from '../../domain/ports/IProductRepository.js';

export class DeleteProductUseCase {
  private readonly productRepo: IProductRepository;

  public constructor(productRepo: IProductRepository) {
    this.productRepo = productRepo;
  }

  public async execute(id: string): Promise<Result<void, Error>> {
    const product = await this.productRepo.findById(id);
    if (!product) {
      return Result.fail(new Error('Producto no encontrado'));
    }

    try {
      await this.productRepo.delete(id);
      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al eliminar producto'));
    }
  }
}

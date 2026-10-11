import { Result } from '../../../../shared-kernel/Result.js';
import { Product } from '../../domain/entities/Product.js';
import { IProductRepository } from '../../domain/ports/IProductRepository.js';

export class GetProductBySlugUseCase {
  private readonly productRepo: IProductRepository;

  public constructor(productRepo: IProductRepository) {
    this.productRepo = productRepo;
  }

  public async execute(slug: string): Promise<Result<Product, Error>> {
    const product = await this.productRepo.findBySlug(slug);
    if (!product) {
      return Result.fail(new Error('Producto no encontrado'));
    }
    return Result.ok(product);
  }
}

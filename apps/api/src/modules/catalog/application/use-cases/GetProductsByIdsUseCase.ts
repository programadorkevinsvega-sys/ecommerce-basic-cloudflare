import { Result } from '../../../../shared-kernel/Result.js';
import { Product } from '../../domain/entities/Product.js';
import { IProductRepository } from '../../domain/ports/IProductRepository.js';

const MAX_PRODUCT_IDS = 50;

export class GetProductsByIdsUseCase {
  public constructor(private readonly products: IProductRepository) {}

  public async execute(ids: string[]): Promise<Result<Product[], Error>> {
    if (ids.length > MAX_PRODUCT_IDS || ids.some((id) => !id || id.length > 128)) {
      return Result.fail(new Error('Lista de productos inválida'));
    }
    return Result.ok(await this.products.findByIds([...new Set(ids)]));
  }
}

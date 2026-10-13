import { Result } from '../../../../shared-kernel/Result.js';
import { Product } from '../../domain/entities/Product.js';
import { IProductRepository } from '../../domain/ports/IProductRepository.js';

export class GetProductByIdUseCase {
  constructor(private readonly products: IProductRepository) {}

  public async execute(id: string): Promise<Result<Product, Error>> {
    const product = await this.products.findById(id);
    return product ? Result.ok(product) : Result.fail(new Error('Producto no encontrado'));
  }
}

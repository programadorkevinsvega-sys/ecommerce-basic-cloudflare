import { Result } from '../../../../shared-kernel/Result.js';
import { Product } from '../../domain/entities/Product.js';
import { IProductRepository } from '../../domain/ports/IProductRepository.js';

export interface ListProductsInput {
  limit?: number;
  offset?: number;
  status?: string;
  searchQuery?: string;
}

export class ListProductsUseCase {
  private readonly productRepo: IProductRepository;

  public constructor(productRepo: IProductRepository) {
    this.productRepo = productRepo;
  }

  public async execute(input: ListProductsInput): Promise<Result<Product[], Error>> {
    const limit = Math.min(input.limit || 20, 100);
    const offset = input.offset || 0;

    let products: Product[];
    if (input.searchQuery && input.searchQuery.trim().length > 0) {
      products = await this.productRepo.search(input.searchQuery.trim(), limit, offset);
    } else {
      products = await this.productRepo.list(limit, offset, input.status);
    }

    return Result.ok(products);
  }
}

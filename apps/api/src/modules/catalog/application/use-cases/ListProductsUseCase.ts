import { Result } from '../../../../shared-kernel/Result.js';
import { Product } from '../../domain/entities/Product.js';
import { IProductRepository } from '../../domain/ports/IProductRepository.js';
import { ProductListFilters } from '../../domain/ports/ProductListQuery.js';
import { ProductAdminListItem } from '../../domain/ports/ProductAdminListItem.js';

export interface ListProductsInput extends ProductListFilters {
  limit?: number;
  offset?: number;
  status?: string;
  searchQuery?: string;
  relatedToId?: string;
}

export class ListProductsUseCase {
  private readonly productRepo: IProductRepository;

  public constructor(productRepo: IProductRepository) {
    this.productRepo = productRepo;
  }

  public count(status?: string, query?: string): Promise<number> {
    if (this.productRepo.count) return this.productRepo.count(status, query);
    return this.productRepo.list(100, 0, status).then((products) => products.length);
  }

  public adminList(input: { limit?: number; offset?: number; status?: string; query?: string }): Promise<ProductAdminListItem[]> {
    const limit = Math.min(Math.max(input.limit ?? 25, 1), 50);
    const offset = Math.max(input.offset ?? 0, 0);
    return this.productRepo.listAdmin(limit, offset, input.status, input.query);
  }

  public async execute(input: ListProductsInput): Promise<Result<Product[], Error>> {
    const limit = Math.min(input.limit || 20, 100);
    const offset = input.offset || 0;

    if (input.relatedToId) return Result.ok(await this.related(input.relatedToId, limit));

    let products: Product[];
    if (input.searchQuery && input.searchQuery.trim().length > 0) {
      products = await this.productRepo.search(input.searchQuery.trim(), limit, offset, input.status, input);
    } else {
      products = await this.productRepo.list(limit, offset, input.status, input);
    }

    return Result.ok(products);
  }

  private async related(productId: string, limit: number): Promise<Product[]> {
    const source = await this.productRepo.findById(productId);
    if (!source || source.status !== 'published') return [];
    const candidates = await this.productRepo.list(100, 0, 'published');
    const sourceTags = new Set(source.tags.map((tag) => tag.toLocaleLowerCase()));
    const sourceCategories = new Set(source.categoryIds);
    return candidates.filter((product) => product.id !== source.id).map((product) => {
      const score = product.tags.filter((tag) => sourceTags.has(tag.toLocaleLowerCase())).length * 3
        + Number(Boolean(source.brand && product.brand?.toLocaleLowerCase() === source.brand.toLocaleLowerCase())) * 2
        + Number(Boolean(source.productType && product.productType?.toLocaleLowerCase() === source.productType.toLocaleLowerCase())) * 2
        + product.categoryIds.filter((id) => sourceCategories.has(id)).length;
      return { product, score };
    }).filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || Number(b.product.stockQuantity > 0) - Number(a.product.stockQuantity > 0) || a.product.name.localeCompare(b.product.name))
      .slice(0, limit).map(({ product }) => product);
  }
}

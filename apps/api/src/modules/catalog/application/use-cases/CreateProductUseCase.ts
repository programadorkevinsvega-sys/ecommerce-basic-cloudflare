import { Result } from '../../../../shared-kernel/Result.js';
import { Product, ProductStatus } from '../../domain/entities/Product.js';
import { ProductSalePolicy, ShippingScope, SaleMode } from '../../domain/entities/ProductSalePolicy.js';
import { IProductRepository } from '../../domain/ports/IProductRepository.js';

export interface CreateProductInput {
  name: string;
  slug: string;
  description: string;
  priceInCents: number;
  sku: string;
  stockQuantity: number;
  status?: ProductStatus;
  allowsCashOnDelivery: boolean;
  shippingScope: ShippingScope;
  localCoverageZones?: string[];
  saleMode?: SaleMode;
  categoryIds?: string[];
  mediaIds?: string[];
}

export class CreateProductUseCase {
  private readonly productRepo: IProductRepository;

  public constructor(productRepo: IProductRepository) {
    this.productRepo = productRepo;
  }

  public async execute(input: CreateProductInput): Promise<Result<Product, Error>> {
    const existing = await this.productRepo.findBySlug(input.slug);
    if (existing) {
      return Result.fail(new Error(`Ya existe un producto con el slug '${input.slug}'`));
    }

    try {
      const salePolicy = new ProductSalePolicy({
        allowsCashOnDelivery: input.allowsCashOnDelivery,
        shippingScope: input.shippingScope,
        localCoverageZones: input.localCoverageZones || [],
        saleMode: input.saleMode || 'cash',
      });

      const now = new Date().toISOString();
      const product = new Product({
        id: crypto.randomUUID(),
        name: input.name,
        slug: input.slug,
        description: input.description,
        priceInCents: input.priceInCents,
        sku: input.sku,
        stockQuantity: input.stockQuantity,
        status: input.status || 'draft',
        salePolicy,
        categoryIds: input.categoryIds || [],
        mediaIds: input.mediaIds || [],
        createdAt: now,
        updatedAt: now,
      });

      await this.productRepo.save(product);
      return Result.ok(product);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al crear producto'));
    }
  }
}

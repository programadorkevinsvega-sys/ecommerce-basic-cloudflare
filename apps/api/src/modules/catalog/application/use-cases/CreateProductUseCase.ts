import { Result } from '../../../../shared-kernel/Result.js';
import { Product, ProductStatus, ProductCondition } from '../../domain/entities/Product.js';
import { ProductSalePolicy, ShippingScope, SaleMode } from '../../domain/entities/ProductSalePolicy.js';
import { ProductSeoHelper } from '../../domain/services/ProductSeoHelper.js';
import { IProductRepository } from '../../domain/ports/IProductRepository.js';

export interface CreateProductInput {
  name: string;
  slug?: string;
  description: string;
  priceInCents: number;
  sku: string;
  stockQuantity: number;
  status?: ProductStatus;
  condition?: ProductCondition;
  specifications?: Record<string, unknown>;
  brand?: string;
  productType?: string;
  tags?: string[];
  barcodeGtin?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImageId?: string;
  noindex?: boolean;
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
    const rawSlug = input.slug && input.slug.trim().length > 0
      ? input.slug.trim()
      : ProductSeoHelper.slugify(input.name);

    const existing = await this.productRepo.findBySlug(rawSlug);
    if (existing) {
      return Result.fail(new Error(`Ya existe un producto con el slug '${rawSlug}'`));
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
        slug: rawSlug,
        description: input.description,
        priceInCents: input.priceInCents,
        sku: input.sku,
        stockQuantity: input.stockQuantity,
        status: input.status || 'draft',
        condition: input.condition || 'new',
        specifications: input.specifications || {},
        brand: input.brand,
        productType: input.productType,
        tags: input.tags || [],
        barcodeGtin: input.barcodeGtin,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        canonicalUrl: input.canonicalUrl,
        ogImageId: input.ogImageId,
        noindex: Boolean(input.noindex),
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

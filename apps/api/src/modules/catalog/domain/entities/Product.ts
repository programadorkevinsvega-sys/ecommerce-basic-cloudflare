import { ProductSalePolicy, ProductSalePolicyProps } from './ProductSalePolicy.js';

export type ProductStatus = 'draft' | 'published' | 'archived';
export type ProductCondition = 'new' | 'used' | 'refurbished';

export interface ProductProps {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceInCents: number;
  sku: string;
  stockQuantity: number;
  status: ProductStatus;
  condition: ProductCondition;
  specifications: Record<string, unknown>;
  brand?: string;
  productType?: string;
  tags: string[];
  barcodeGtin?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImageId?: string;
  noindex: boolean;
  salePolicy: ProductSalePolicy;
  categoryIds: string[];
  mediaIds: string[];
  createdAt: string;
  updatedAt: string;
}

export class Product {
  private readonly props: ProductProps;

  public constructor(props: ProductProps) {
    if (props.priceInCents < 0 || !Number.isInteger(props.priceInCents)) {
      throw new Error('El precio debe ser un número entero positivo en centavos COP');
    }
    this.props = props;
  }

  public get id(): string { return this.props.id; }
  public get name(): string { return this.props.name; }
  public get slug(): string { return this.props.slug; }
  public get description(): string { return this.props.description; }
  public get priceInCents(): number { return this.props.priceInCents; }
  public get sku(): string { return this.props.sku; }
  public get stockQuantity(): number { return this.props.stockQuantity; }
  public get status(): ProductStatus { return this.props.status; }
  public get condition(): ProductCondition { return this.props.condition; }
  public get specifications(): Record<string, unknown> { return { ...this.props.specifications }; }
  public get brand(): string | undefined { return this.props.brand; }
  public get productType(): string | undefined { return this.props.productType; }
  public get tags(): string[] { return [...this.props.tags]; }
  public get barcodeGtin(): string | undefined { return this.props.barcodeGtin; }
  public get seoTitle(): string | undefined { return this.props.seoTitle; }
  public get seoDescription(): string | undefined { return this.props.seoDescription; }
  public get canonicalUrl(): string | undefined { return this.props.canonicalUrl; }
  public get ogImageId(): string | undefined { return this.props.ogImageId; }
  public get noindex(): boolean { return this.props.noindex; }
  public get salePolicy(): ProductSalePolicy { return this.props.salePolicy; }
  public get categoryIds(): string[] { return [...this.props.categoryIds]; }
  public get mediaIds(): string[] { return [...this.props.mediaIds]; }
  public get createdAt(): string { return this.props.createdAt; }
  public get updatedAt(): string { return this.props.updatedAt; }

  public updateSlug(newSlug: string): void {
    if (!newSlug || newSlug.trim().length === 0) {
      throw new Error('El slug no puede estar vacío');
    }
    this.props.slug = newSlug.trim();
    this.props.updatedAt = new Date().toISOString();
  }

  public toPrimitives(): Omit<ProductProps, 'salePolicy'> & { salePolicy: ProductSalePolicyProps } {
    return {
      ...this.props,
      specifications: { ...this.props.specifications },
      tags: [...this.props.tags],
      categoryIds: [...this.props.categoryIds],
      mediaIds: [...this.props.mediaIds],
      salePolicy: this.props.salePolicy.toPrimitives(),
    };
  }
}

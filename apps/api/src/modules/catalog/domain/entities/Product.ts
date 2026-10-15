import { ProductSalePolicy, ProductSalePolicyProps } from './ProductSalePolicy.js';

export type ProductStatus = 'draft' | 'published' | 'archived';
export type ProductCondition = 'new' | 'used' | 'refurbished';

export interface ProductProps {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceInCents: number;
  supplierCostCents?: number | null;
  targetMarginBasisPoints?: number;
  pricingTargetType?: 'margin' | 'profit';
  targetProfitCents?: number | null;
  packedWidthCm?: number | null;
  packedLengthCm?: number | null;
  packedHeightCm?: number | null;
  packedWeightGrams?: number | null;
  allowedPaymentMethods?: Array<'wompi' | 'cash_on_delivery'>;
  pricingVersion?: number;
  legacyPriceBeforeTaxCents?: number | null;
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
  public get supplierCostCents(): number | null { return this.props.supplierCostCents ?? null; }
  public get targetMarginBasisPoints(): number { return this.props.targetMarginBasisPoints ?? 2000; }
  public get pricingTargetType(): 'margin' | 'profit' { return this.props.pricingTargetType ?? 'margin'; }
  public get targetProfitCents(): number | null { return this.props.targetProfitCents ?? null; }
  public get packedWidthCm(): number | null { return this.props.packedWidthCm ?? null; }
  public get packedLengthCm(): number | null { return this.props.packedLengthCm ?? null; }
  public get packedHeightCm(): number | null { return this.props.packedHeightCm ?? null; }
  public get packedWeightGrams(): number | null { return this.props.packedWeightGrams ?? null; }
  public get allowedPaymentMethods(): Array<'wompi' | 'cash_on_delivery'> { return [...(this.props.allowedPaymentMethods ?? ['wompi', 'cash_on_delivery'])]; }
  public get pricingVersion(): number { return this.props.pricingVersion ?? 1; }
  public get legacyPriceBeforeTaxCents(): number | null { return this.props.legacyPriceBeforeTaxCents ?? null; }
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

  public updateDetails(updates: Partial<Omit<ProductProps, 'id' | 'createdAt' | 'updatedAt'>>): void {
    if (updates.name !== undefined) this.props.name = updates.name.trim();
    if (updates.slug !== undefined) {
      const normalizedSlug = updates.slug.trim().toLowerCase();
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
        throw new Error('El slug debe contener solo letras minúsculas, números y guiones');
      }
      this.props.slug = normalizedSlug;
    }
    if (updates.description !== undefined) this.props.description = updates.description;
    if (updates.priceInCents !== undefined) {
      if (updates.priceInCents < 0 || !Number.isInteger(updates.priceInCents)) {
        throw new Error('El precio debe ser un número entero positivo en centavos COP');
      }
      this.props.priceInCents = updates.priceInCents;
    }
    if (updates.supplierCostCents !== undefined) this.props.supplierCostCents = updates.supplierCostCents;
    if (updates.targetMarginBasisPoints !== undefined) this.props.targetMarginBasisPoints = updates.targetMarginBasisPoints;
    if (updates.pricingTargetType !== undefined) this.props.pricingTargetType = updates.pricingTargetType;
    if (updates.targetProfitCents !== undefined) this.props.targetProfitCents = updates.targetProfitCents;
    if (updates.packedWidthCm !== undefined) this.props.packedWidthCm = updates.packedWidthCm;
    if (updates.packedLengthCm !== undefined) this.props.packedLengthCm = updates.packedLengthCm;
    if (updates.packedHeightCm !== undefined) this.props.packedHeightCm = updates.packedHeightCm;
    if (updates.packedWeightGrams !== undefined) this.props.packedWeightGrams = updates.packedWeightGrams;
    if (updates.allowedPaymentMethods !== undefined) this.props.allowedPaymentMethods = [...updates.allowedPaymentMethods];
    if (updates.pricingVersion !== undefined) this.props.pricingVersion = updates.pricingVersion;
    if (updates.legacyPriceBeforeTaxCents !== undefined) this.props.legacyPriceBeforeTaxCents = updates.legacyPriceBeforeTaxCents;
    if (updates.sku !== undefined) this.props.sku = updates.sku.trim();
    if (updates.stockQuantity !== undefined) this.props.stockQuantity = updates.stockQuantity;
    if (updates.status !== undefined) this.props.status = updates.status;
    if (updates.condition !== undefined) this.props.condition = updates.condition;
    if (updates.specifications !== undefined) this.props.specifications = { ...updates.specifications };
    if (updates.brand !== undefined) this.props.brand = updates.brand;
    if (updates.productType !== undefined) this.props.productType = updates.productType;
    if (updates.tags !== undefined) this.props.tags = [...updates.tags];
    if (updates.barcodeGtin !== undefined) this.props.barcodeGtin = updates.barcodeGtin;
    if (updates.seoTitle !== undefined) this.props.seoTitle = updates.seoTitle;
    if (updates.seoDescription !== undefined) this.props.seoDescription = updates.seoDescription;
    if (updates.canonicalUrl !== undefined) this.props.canonicalUrl = updates.canonicalUrl;
    if (updates.ogImageId !== undefined) this.props.ogImageId = updates.ogImageId;
    if (updates.noindex !== undefined) this.props.noindex = updates.noindex;
    if (updates.salePolicy !== undefined) this.props.salePolicy = updates.salePolicy;
    if (updates.categoryIds !== undefined) this.props.categoryIds = [...updates.categoryIds];
    if (updates.mediaIds !== undefined) this.props.mediaIds = [...updates.mediaIds];
    this.props.updatedAt = new Date().toISOString();
  }

  public setStatus(newStatus: ProductStatus): void {
    this.props.status = newStatus;
    this.props.updatedAt = new Date().toISOString();
  }

  public toPrimitives(): Omit<ProductProps, 'salePolicy'> & { salePolicy: ProductSalePolicyProps } {
    return {
      ...this.props,
      supplierCostCents: this.supplierCostCents,
      targetMarginBasisPoints: this.targetMarginBasisPoints,
      pricingTargetType: this.pricingTargetType,
      targetProfitCents: this.targetProfitCents,
      packedWidthCm: this.packedWidthCm,
      packedLengthCm: this.packedLengthCm,
      packedHeightCm: this.packedHeightCm,
      packedWeightGrams: this.packedWeightGrams,
      allowedPaymentMethods: this.allowedPaymentMethods,
      pricingVersion: this.pricingVersion,
      legacyPriceBeforeTaxCents: this.legacyPriceBeforeTaxCents,
      specifications: { ...this.props.specifications },
      tags: [...this.props.tags],
      categoryIds: [...this.props.categoryIds],
      mediaIds: [...this.props.mediaIds],
      salePolicy: this.props.salePolicy.toPrimitives(),
    };
  }
}

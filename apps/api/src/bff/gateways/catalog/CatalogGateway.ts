import { LegacyPriceMigrationPreview } from '../../../modules/catalog/application/use-cases/MigrateLegacyProductPricesUseCase.js';

export interface CreateProductGatewayRequest {
  name: string;
  slug?: string;
  description: string;
  priceInCents: number;
  supplierCostCents?: number;
  targetMarginBasisPoints?: number;
  pricingTargetType?: 'margin' | 'profit';
  targetProfitCents?: number | null;
  allowedPaymentMethods?: Array<'wompi' | 'cash_on_delivery'>;
  taxRateBasisPoints?: number;
  transactionShippingCents?: number;
  sku: string;
  stockQuantity: number;
  status?: 'draft' | 'published' | 'archived';
  condition?: 'new' | 'used' | 'refurbished';
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
  shippingScope: 'national' | 'local';
  localCoverageZones?: string[];
  saleMode?: 'cash' | 'credit' | 'both';
  categoryIds?: string[];
  mediaIds?: string[];
}

export interface UpdateProductGatewayRequest {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  priceInCents?: number;
  supplierCostCents?: number | null;
  targetMarginBasisPoints?: number;
  pricingTargetType?: 'margin' | 'profit';
  targetProfitCents?: number | null;
  allowedPaymentMethods?: Array<'wompi' | 'cash_on_delivery'>;
  taxRateBasisPoints?: number;
  transactionShippingCents?: number;
  sku?: string;
  stockQuantity?: number;
  status?: 'draft' | 'published' | 'archived';
  condition?: 'new' | 'used' | 'refurbished';
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
  allowsCashOnDelivery?: boolean;
  shippingScope?: 'national' | 'local';
  localCoverageZones?: string[];
  saleMode?: 'cash' | 'credit' | 'both';
  categoryIds?: string[];
  mediaIds?: string[];
}

export interface CatalogProductDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceInCents: number;
  supplierCostCents?: number | null;
  targetMarginBasisPoints?: number;
  pricingTargetType?: 'margin' | 'profit';
  targetProfitCents?: number | null;
  allowedPaymentMethods?: Array<'wompi' | 'cash_on_delivery'>;
  pricingVersion?: number;
  sku: string;
  stockQuantity: number;
  status: string;
  condition: 'new' | 'used' | 'refurbished';
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
  salePolicy: {
    allowsCashOnDelivery: boolean;
    shippingScope: 'national' | 'local';
    localCoverageZones: string[];
    saleMode: 'cash' | 'credit' | 'both';
  };
  categoryIds: string[];
  mediaIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
}

export interface BrandDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  websiteUrl?: string;
}

export interface AttributeDto {
  id: string;
  name: string;
  code: string;
  type: string;
  options: string[];
}

export interface SupplierDto {
  id: string; name: string; taxId?: string; email?: string; phone?: string;
  websiteUrl?: string; notes?: string; status: 'active' | 'inactive';
  createdAt: string; updatedAt: string;
}

export interface ProductVariantDto {
  id: string; productId: string; name: string; sku: string; options: Record<string, string>;
  priceInCents?: number; stockQuantity: number; status: 'active' | 'inactive';
  createdAt: string; updatedAt: string;
}

export interface CatalogGateway {
  createProduct(request: CreateProductGatewayRequest): Promise<CatalogProductDto>;
  updateProduct(request: UpdateProductGatewayRequest): Promise<CatalogProductDto>;
  deleteProduct(id: string): Promise<void>;
  getProductBySlug(slug: string): Promise<CatalogProductDto>;
  getProductById(id: string): Promise<CatalogProductDto>;
  listProducts(params: { limit?: number; offset?: number; status?: string; searchQuery?: string }): Promise<CatalogProductDto[]>;
  createCategory(request: { name: string; slug: string; description?: string; parentId?: string }): Promise<CategoryDto>;
  listCategories(): Promise<CategoryDto[]>;
  deleteCategory(id: string): Promise<void>;
  createBrand(request: { name: string; slug?: string; description?: string; websiteUrl?: string }): Promise<BrandDto>;
  listBrands(): Promise<BrandDto[]>;
  updateBrandDescription(id: string, description: string): Promise<BrandDto>;
  createAttribute(request: { name: string; code: string; type: 'text' | 'select' | 'number'; options?: string[] }): Promise<AttributeDto>;
  listAttributes(): Promise<AttributeDto[]>;
  createSupplier(request: Omit<SupplierDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<SupplierDto>;
  listSuppliers(): Promise<SupplierDto[]>;
  createProductVariant(request: Omit<ProductVariantDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductVariantDto>;
  listProductVariants(): Promise<ProductVariantDto[]>;
  previewLegacyPriceMigration(taxRateBasisPoints: number): Promise<LegacyPriceMigrationPreview>;
  migrateLegacyPrices(taxRateBasisPoints: number, expectedCount: number, expectedFingerprint: string): Promise<number>;
}

import { LegacyPriceMigrationPreview } from '../../../modules/catalog/application/use-cases/MigrateLegacyProductPricesUseCase.js';
import { CatalogPageQuery } from '../../../modules/catalog/domain/ports/CatalogPageQuery.js';
import { ProductListFilters } from '../../../modules/catalog/domain/ports/ProductListQuery.js';
import { CatalogTaxonomyKind, CatalogTaxonomyUpdate } from '../../../modules/catalog/application/use-cases/ManageCatalogTaxonomyUseCase.js';
import { ProductAdminListItem } from '../../../modules/catalog/domain/ports/ProductAdminListItem.js';
export interface CatalogProductTagDto { id:string; name:string; description:string; status:'active'|'inactive'; productCount:number; createdAt:string; updatedAt:string; }
export interface SaveCatalogProductTagRequest { id?:string; name:string; description:string; status:'active'|'inactive'; }
export interface CatalogCollectionDto { id:string; name:string; slug:string; description:string; imageMediaId?:string; productIds:string[]; status:'active'|'inactive'; seoTitle?:string; seoDescription?:string; createdAt:string; updatedAt:string; }
export interface CatalogCollectionInput { name:string; slug:string; description:string; imageMediaId?:string | null; productIds:string[]; status:'active'|'inactive'; seoTitle?:string; seoDescription?:string; }

export interface CreateProductGatewayRequest {
  name: string;
  slug?: string;
  description: string;
  priceInCents: number;
  supplierCostCents?: number;
  targetMarginBasisPoints?: number;
  pricingTargetType?: 'margin' | 'profit';
  targetProfitCents?: number | null;
  packedWidthCm?: number | null;
  packedLengthCm?: number | null;
  packedHeightCm?: number | null;
  packedWeightGrams?: number | null;
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
  tags?: string[]; guideTitle?: string; guideContent?: string; relatedBlogPostIds?: string[];
  barcodeGtin?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImageId?: string;
  noindex?: boolean; electronicInvoiceEnabled?: boolean;
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
  packedWidthCm?: number | null;
  packedLengthCm?: number | null;
  packedHeightCm?: number | null;
  packedWeightGrams?: number | null;
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
  tags?: string[]; guideTitle?: string; guideContent?: string; relatedBlogPostIds?: string[];
  barcodeGtin?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImageId?: string;
  noindex?: boolean; electronicInvoiceEnabled?: boolean;
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
  packedWidthCm?: number | null;
  packedLengthCm?: number | null;
  packedHeightCm?: number | null;
  packedWeightGrams?: number | null;
  allowedPaymentMethods?: Array<'wompi' | 'cash_on_delivery'>;
  pricingVersion?: number;
  sku: string;
  stockQuantity: number;
  status: string;
  condition: 'new' | 'used' | 'refurbished';
  specifications: Record<string, unknown>;
  brand?: string;
  productType?: string;
  tags: string[]; guideTitle?: string; guideContent?: string; relatedBlogPostIds?: string[];
  barcodeGtin?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImageId?: string;
  noindex: boolean; electronicInvoiceEnabled?: boolean;
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
  status?: 'active' | 'inactive';
}

export interface BrandDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  websiteUrl?: string;
  imageMediaId?: string;
  status?: 'active' | 'inactive';
}

export interface AttributeDto {
  id: string;
  name: string;
  code: string;
  type: string;
  options: string[];
  status?: 'active' | 'inactive';
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
  listProducts(params: { limit?: number; offset?: number; status?: string; searchQuery?: string; relatedToId?: string } & ProductListFilters): Promise<CatalogProductDto[]>;
  listAdminProducts(params: { limit?: number; offset?: number; status?: string; query?: string }): Promise<ProductAdminListItem[]>; countProducts(status?: string, query?: string): Promise<number>;
  createCategory(request: { name: string; slug: string; description?: string; parentId?: string }): Promise<CategoryDto>;
  listCategories(query?: CatalogPageQuery): Promise<CategoryDto[]>;
  getCategoryById(id: string): Promise<CategoryDto | null>;
  getBrandById(id: string): Promise<BrandDto | null>;
  getAttributeById(id: string): Promise<AttributeDto | null>;
  deleteCategory(id: string): Promise<void>;
  createBrand(request: { name: string; slug?: string; description?: string; websiteUrl?: string; imageMediaId?: string }): Promise<BrandDto>;
  listBrands(query?: CatalogPageQuery): Promise<BrandDto[]>;
  updateBrandDescription(id: string, description: string): Promise<BrandDto>;
  createAttribute(request: { name: string; code: string; type: 'text' | 'select' | 'number'; options?: string[] }): Promise<AttributeDto>;
  listAttributes(query?: CatalogPageQuery): Promise<AttributeDto[]>;
  createSupplier(request: Omit<SupplierDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<SupplierDto>;
  listSuppliers(query?: CatalogPageQuery): Promise<SupplierDto[]>;
  createProductVariant(request: Omit<ProductVariantDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductVariantDto>;
  listProductVariants(query?: CatalogPageQuery): Promise<ProductVariantDto[]>;
  updateTaxonomy(input: CatalogTaxonomyUpdate): Promise<void>;
  countTaxonomy(kind: CatalogTaxonomyKind, query?: string): Promise<number>;
  deleteTaxonomy(kind: CatalogTaxonomyKind, id: string): Promise<void>;
  listCollections(query?: CatalogPageQuery): Promise<CatalogCollectionDto[]>;
  countCollections(includeInactive?: boolean, query?: string): Promise<number>;
  getCollectionBySlug(slug: string): Promise<CatalogCollectionDto>;
  findCollectionBySlug(slug: string): Promise<CatalogCollectionDto | null>;
  getCollectionById(id: string): Promise<CatalogCollectionDto>;
  saveCollection(input: CatalogCollectionInput, id?: string): Promise<CatalogCollectionDto>;
  deleteCollection(id: string): Promise<void>;
  listProductTags(includeInactive?: boolean, page?: number, pageSize?: number): Promise<CatalogProductTagDto[]>;
  countProductTags(includeInactive?: boolean): Promise<number>;
  saveProductTag(input: SaveCatalogProductTagRequest): Promise<CatalogProductTagDto>;
  deleteProductTag(id: string): Promise<void>;
  previewLegacyPriceMigration(taxRateBasisPoints: number): Promise<LegacyPriceMigrationPreview>;
  migrateLegacyPrices(taxRateBasisPoints: number, expectedCount: number, expectedFingerprint: string): Promise<number>;
}

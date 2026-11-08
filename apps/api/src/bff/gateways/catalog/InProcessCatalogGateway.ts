import {
  CatalogGateway,
  CreateProductGatewayRequest,
  UpdateProductGatewayRequest,
  CatalogProductDto,
  CategoryDto,
  BrandDto,
  AttributeDto,
  SupplierDto,
  ProductVariantDto,
  CatalogCollectionDto,
} from './CatalogGateway.js';
import { ICatalogPublicApi } from '../../../modules/catalog/module.public-api.js';
import { ProductListFilters } from '../../../modules/catalog/domain/ports/ProductListQuery.js';

export class InProcessCatalogGateway implements CatalogGateway {
  private readonly publicApi: ICatalogPublicApi;

  public constructor(publicApi: ICatalogPublicApi) {
    this.publicApi = publicApi;
  }

  public async createProduct(request: CreateProductGatewayRequest): Promise<CatalogProductDto> {
    const product = await this.publicApi.createProduct(request);
    return product.toPrimitives();
  }

  public async updateProduct(request: UpdateProductGatewayRequest): Promise<CatalogProductDto> {
    const product = await this.publicApi.updateProduct(request);
    return product.toPrimitives();
  }

  public async deleteProduct(id: string): Promise<void> {
    await this.publicApi.deleteProduct(id);
  }

  public async getProductBySlug(slug: string): Promise<CatalogProductDto> {
    const product = await this.publicApi.getProductBySlug(slug);
    return product.toPrimitives();
  }

  public async getProductById(id: string): Promise<CatalogProductDto> {
    const product = await this.publicApi.getProductById(id);
    return product.toPrimitives();
  }

  public async listProducts(params: {
    limit?: number;
    offset?: number;
    status?: string;
    searchQuery?: string;
    relatedToId?: string;
  } & ProductListFilters): Promise<CatalogProductDto[]> {
    const products = await this.publicApi.listProducts(params);
    return products.map((p) => p.toPrimitives());
  }

  public listAdminProducts(params: { limit?: number; offset?: number; status?: string; query?: string }) {
    return this.publicApi.listAdminProducts(params);
  }

  public countProducts(status?: string, query?: string): Promise<number> { return this.publicApi.countProducts(status, query); }

  public async createCategory(request: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
  }): Promise<CategoryDto> {
    const category = await this.publicApi.createCategory(request);
    return category.toPrimitives();
  }

  public async listCategories(query?: { limit?: number; offset?: number; includeInactive?: boolean }): Promise<CategoryDto[]> {
    const categories = await this.publicApi.listCategories(query);
    return categories.map((c) => c.toPrimitives());
  }

  public async getCategoryById(id: string): Promise<CategoryDto | null> {
    const category = await this.publicApi.getCategoryById(id);
    return category?.toPrimitives() ?? null;
  }

  public async getBrandById(id: string): Promise<BrandDto | null> {
    const brand = await this.publicApi.getBrandById(id);
    return brand?.toPrimitives() ?? null;
  }

  public async getAttributeById(id: string): Promise<AttributeDto | null> {
    const attribute = await this.publicApi.getAttributeById(id);
    return attribute?.toPrimitives() ?? null;
  }

  public async deleteCategory(id: string): Promise<void> {
    await this.publicApi.deleteCategory(id);
  }

  public async createBrand(request: {
    name: string;
    slug?: string;
    description?: string;
    websiteUrl?: string;
    imageMediaId?: string;
  }): Promise<BrandDto> {
    const brand = await this.publicApi.createBrand(request);
    return brand.toPrimitives();
  }

  public async listBrands(query?: { limit?: number; offset?: number; includeInactive?: boolean }): Promise<BrandDto[]> {
    const brands = await this.publicApi.listBrands(query);
    return brands.map((b) => b.toPrimitives());
  }

  public async updateBrandDescription(id: string, description: string): Promise<BrandDto> {
    return (await this.publicApi.updateBrandDescription(id, description)).toPrimitives();
  }

  public async createAttribute(request: {
    name: string;
    code: string;
    type: 'text' | 'select' | 'number';
    options?: string[];
  }): Promise<AttributeDto> {
    const attribute = await this.publicApi.createAttribute(request);
    return attribute.toPrimitives();
  }

  public async listAttributes(query?: { limit?: number; offset?: number; includeInactive?: boolean }): Promise<AttributeDto[]> {
    const attributes = await this.publicApi.listAttributes(query);
    return attributes.map((a) => a.toPrimitives());
  }

  public async createSupplier(request: Omit<SupplierDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<SupplierDto> {
    return (await this.publicApi.createSupplier(request)).toPrimitives();
  }

  public async listSuppliers(query?: { limit?: number; offset?: number; includeInactive?: boolean }): Promise<SupplierDto[]> {
    return (await this.publicApi.listSuppliers(query)).map((supplier) => supplier.toPrimitives());
  }

  public async createProductVariant(request: Omit<ProductVariantDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductVariantDto> {
    return (await this.publicApi.createProductVariant(request)).toPrimitives();
  }

  public async listProductVariants(query?: { limit?: number; offset?: number; includeInactive?: boolean }): Promise<ProductVariantDto[]> {
    return (await this.publicApi.listProductVariants(query)).map((variant) => variant.toPrimitives());
  }

  public updateTaxonomy(input: Parameters<CatalogGateway['updateTaxonomy']>[0]): Promise<void> {
    return this.publicApi.updateTaxonomy(input);
  }
  public countTaxonomy(kind: Parameters<CatalogGateway['countTaxonomy']>[0], query?: string): Promise<number> { return this.publicApi.countTaxonomy(kind, query); }

  public deleteTaxonomy(kind: Parameters<CatalogGateway['deleteTaxonomy']>[0], id: string): Promise<void> {
    return this.publicApi.deleteTaxonomy(kind, id);
  }

  public async listCollections(query?: { limit?: number; offset?: number; includeInactive?: boolean }): Promise<CatalogCollectionDto[]> {
    return (await this.publicApi.listCollections(query)).map((collection) => collection.toPrimitives());
  }
  public countCollections(includeInactive = true, query?: string): Promise<number> { return this.publicApi.countCollections(includeInactive, query); }
  public async getCollectionBySlug(slug: string): Promise<CatalogCollectionDto> {
    return (await this.publicApi.getCollectionBySlug(slug)).toPrimitives();
  }
  public async findCollectionBySlug(slug: string): Promise<CatalogCollectionDto | null> {
    const collection = await this.publicApi.findCollectionBySlug(slug);
    return collection?.toPrimitives() ?? null;
  }
  public async getCollectionById(id: string): Promise<CatalogCollectionDto> {
    return (await this.publicApi.getCollectionById(id)).toPrimitives();
  }
  public async saveCollection(input: Parameters<CatalogGateway['saveCollection']>[0], id?: string): Promise<CatalogCollectionDto> {
    return (await this.publicApi.saveCollection(input,id)).toPrimitives();
  }
  public deleteCollection(id: string): Promise<void> { return this.publicApi.deleteCollection(id); }

  public listProductTags(includeInactive = true, page = 1, pageSize = 25) { return this.publicApi.listProductTags(includeInactive, page, pageSize); }
  public countProductTags(includeInactive = true) { return this.publicApi.countProductTags(includeInactive); }
  public saveProductTag(input: Parameters<CatalogGateway['saveProductTag']>[0]) { return this.publicApi.saveProductTag(input); }
  public deleteProductTag(id: string): Promise<void> { return this.publicApi.deleteProductTag(id); }

  public async previewLegacyPriceMigration(taxRateBasisPoints: number) {
    return this.publicApi.previewLegacyPriceMigration(taxRateBasisPoints);
  }

  public async migrateLegacyPrices(taxRateBasisPoints: number, expectedCount: number, expectedFingerprint: string): Promise<number> {
    return this.publicApi.migrateLegacyPrices(taxRateBasisPoints, expectedCount, expectedFingerprint);
  }
}

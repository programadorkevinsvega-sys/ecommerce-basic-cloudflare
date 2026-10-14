import {
  CatalogGateway,
  CreateProductGatewayRequest,
  UpdateProductGatewayRequest,
  CatalogProductDto,
  CategoryDto,
  BrandDto,
  AttributeDto,
} from './CatalogGateway.js';
import { ICatalogPublicApi } from '../../../modules/catalog/module.public-api.js';

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
  }): Promise<CatalogProductDto[]> {
    const products = await this.publicApi.listProducts(params);
    return products.map((p) => p.toPrimitives());
  }

  public async createCategory(request: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
  }): Promise<CategoryDto> {
    const category = await this.publicApi.createCategory(request);
    return category.toPrimitives();
  }

  public async listCategories(): Promise<CategoryDto[]> {
    const categories = await this.publicApi.listCategories();
    return categories.map((c) => c.toPrimitives());
  }

  public async deleteCategory(id: string): Promise<void> {
    await this.publicApi.deleteCategory(id);
  }

  public async createBrand(request: {
    name: string;
    slug?: string;
    description?: string;
    websiteUrl?: string;
  }): Promise<BrandDto> {
    const brand = await this.publicApi.createBrand(request);
    return brand.toPrimitives();
  }

  public async listBrands(): Promise<BrandDto[]> {
    const brands = await this.publicApi.listBrands();
    return brands.map((b) => b.toPrimitives());
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

  public async listAttributes(): Promise<AttributeDto[]> {
    const attributes = await this.publicApi.listAttributes();
    return attributes.map((a) => a.toPrimitives());
  }

  public async previewLegacyPriceMigration(taxRateBasisPoints: number) {
    return this.publicApi.previewLegacyPriceMigration(taxRateBasisPoints);
  }

  public async migrateLegacyPrices(taxRateBasisPoints: number, expectedCount: number, expectedFingerprint: string): Promise<number> {
    return this.publicApi.migrateLegacyPrices(taxRateBasisPoints, expectedCount, expectedFingerprint);
  }
}


import {
  CatalogGateway,
  CreateProductGatewayRequest,
  CatalogProductDto,
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

  public async getProductBySlug(slug: string): Promise<CatalogProductDto> {
    const product = await this.publicApi.getProductBySlug(slug);
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
  }): Promise<{ id: string; name: string; slug: string }> {
    const category = await this.publicApi.createCategory(request);
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
    };
  }
}

import { CatalogModuleContainer } from './module.config.js';
import { CreateProductInput } from './application/use-cases/CreateProductUseCase.js';
import { ListProductsInput } from './application/use-cases/ListProductsUseCase.js';
import { CreateCategoryInput } from './application/use-cases/CreateCategoryUseCase.js';
import { Product } from './domain/entities/Product.js';
import { Category } from './domain/entities/Category.js';

export interface ICatalogPublicApi {
  createProduct(input: CreateProductInput): Promise<Product>;
  getProductBySlug(slug: string): Promise<Product>;
  listProducts(input: ListProductsInput): Promise<Product[]>;
  createCategory(input: CreateCategoryInput): Promise<Category>;
}

export class CatalogPublicApi implements ICatalogPublicApi {
  private readonly container: CatalogModuleContainer;

  public constructor(container: CatalogModuleContainer) {
    this.container = container;
  }

  public async createProduct(input: CreateProductInput): Promise<Product> {
    const res = await this.container.createProductUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async getProductBySlug(slug: string): Promise<Product> {
    const res = await this.container.getProductBySlugUseCase.execute(slug);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async listProducts(input: ListProductsInput): Promise<Product[]> {
    const res = await this.container.listProductsUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async createCategory(input: CreateCategoryInput): Promise<Category> {
    const res = await this.container.createCategoryUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }
}

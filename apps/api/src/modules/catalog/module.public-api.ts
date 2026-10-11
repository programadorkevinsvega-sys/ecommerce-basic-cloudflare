import { CatalogModuleContainer } from './module.config.js';
import { CreateProductInput } from './application/use-cases/CreateProductUseCase.js';
import { UpdateProductInput } from './application/use-cases/UpdateProductUseCase.js';
import { ListProductsInput } from './application/use-cases/ListProductsUseCase.js';
import { CreateCategoryInput } from './application/use-cases/CreateCategoryUseCase.js';
import { CreateBrandInput } from './application/use-cases/CreateBrandUseCase.js';
import { CreateAttributeInput } from './application/use-cases/CreateAttributeUseCase.js';
import { Product } from './domain/entities/Product.js';
import { Category } from './domain/entities/Category.js';
import { Brand } from './domain/entities/Brand.js';
import { Attribute } from './domain/entities/Attribute.js';

export interface ICatalogPublicApi {
  createProduct(input: CreateProductInput): Promise<Product>;
  updateProduct(input: UpdateProductInput): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  getProductBySlug(slug: string): Promise<Product>;
  listProducts(input: ListProductsInput): Promise<Product[]>;
  createCategory(input: CreateCategoryInput): Promise<Category>;
  listCategories(): Promise<Category[]>;
  deleteCategory(id: string): Promise<void>;
  createBrand(input: CreateBrandInput): Promise<Brand>;
  listBrands(): Promise<Brand[]>;
  createAttribute(input: CreateAttributeInput): Promise<Attribute>;
  listAttributes(): Promise<Attribute[]>;
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

  public async updateProduct(input: UpdateProductInput): Promise<Product> {
    const res = await this.container.updateProductUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async deleteProduct(id: string): Promise<void> {
    const res = await this.container.deleteProductUseCase.execute(id);
    if (res.isFail()) throw res.error;
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

  public async listCategories(): Promise<Category[]> {
    const res = await this.container.listCategoriesUseCase.execute();
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async deleteCategory(id: string): Promise<void> {
    const res = await this.container.deleteCategoryUseCase.execute(id);
    if (res.isFail()) throw res.error;
  }

  public async createBrand(input: CreateBrandInput): Promise<Brand> {
    const res = await this.container.createBrandUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async listBrands(): Promise<Brand[]> {
    const res = await this.container.listBrandsUseCase.execute();
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async createAttribute(input: CreateAttributeInput): Promise<Attribute> {
    const res = await this.container.createAttributeUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async listAttributes(): Promise<Attribute[]> {
    const res = await this.container.listAttributesUseCase.execute();
    if (res.isFail()) throw res.error;
    return res.value;
  }
}

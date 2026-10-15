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
import { LegacyPriceMigrationPreview } from './application/use-cases/MigrateLegacyProductPricesUseCase.js';
import { CreateSupplierInput } from './application/use-cases/CreateSupplierUseCase.js';
import { CreateProductVariantInput } from './application/use-cases/CreateProductVariantUseCase.js';
import { Supplier } from './domain/entities/Supplier.js';
import { ProductVariant } from './domain/entities/ProductVariant.js';
import { CatalogPageQuery } from './domain/ports/CatalogPageQuery.js';
import { CatalogTaxonomyKind, CatalogTaxonomyUpdate } from './application/use-cases/ManageCatalogTaxonomyUseCase.js';
import { CollectionInput } from './application/use-cases/ManageCollectionUseCase.js';
import { Collection } from './domain/entities/Collection.js';
import { ProductTag, SaveProductTagInput } from './domain/entities/ProductTag.js';

export interface ICatalogPublicApi {
  createProduct(input: CreateProductInput): Promise<Product>;
  updateProduct(input: UpdateProductInput): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  getProductBySlug(slug: string): Promise<Product>;
  getProductById(id: string): Promise<Product>;
  listProducts(input: ListProductsInput): Promise<Product[]>;
  createCategory(input: CreateCategoryInput): Promise<Category>;
  listCategories(query?: CatalogPageQuery): Promise<Category[]>;
  deleteCategory(id: string): Promise<void>;
  createBrand(input: CreateBrandInput): Promise<Brand>;
  listBrands(query?: CatalogPageQuery): Promise<Brand[]>;
  updateBrandDescription(id: string, description: string): Promise<Brand>;
  createAttribute(input: CreateAttributeInput): Promise<Attribute>;
  listAttributes(query?: CatalogPageQuery): Promise<Attribute[]>;
  createSupplier(input: CreateSupplierInput): Promise<Supplier>;
  listSuppliers(query?: CatalogPageQuery): Promise<Supplier[]>;
  createProductVariant(input: CreateProductVariantInput): Promise<ProductVariant>;
  listProductVariants(query?: CatalogPageQuery): Promise<ProductVariant[]>;
  updateTaxonomy(input: CatalogTaxonomyUpdate): Promise<void>;
  deleteTaxonomy(kind: CatalogTaxonomyKind, id: string): Promise<void>;
  listCollections(query?: CatalogPageQuery): Promise<Collection[]>;
  getCollectionBySlug(slug: string): Promise<Collection>;
  findCollectionBySlug(slug: string): Promise<Collection | null>;
  getCollectionById(id: string): Promise<Collection>;
  saveCollection(input: CollectionInput, id?: string): Promise<Collection>;
  deleteCollection(id: string): Promise<void>;
  listProductTags(includeInactive?: boolean): Promise<ProductTag[]>;
  saveProductTag(input: SaveProductTagInput): Promise<ProductTag>;
  deleteProductTag(id: string): Promise<void>;
  previewLegacyPriceMigration(taxRateBasisPoints: number): Promise<LegacyPriceMigrationPreview>;
  migrateLegacyPrices(taxRateBasisPoints: number, expectedCount: number, expectedFingerprint: string): Promise<number>;
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

  public async getProductById(id: string): Promise<Product> {
    const res = await this.container.getProductByIdUseCase.execute(id);
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

  public async listCategories(query?: CatalogPageQuery): Promise<Category[]> {
    const res = await this.container.listCategoriesUseCase.execute(query);
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

  public async listBrands(query?: CatalogPageQuery): Promise<Brand[]> {
    const res = await this.container.listBrandsUseCase.execute(query);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async updateBrandDescription(id: string, description: string): Promise<Brand> {
    const res = await this.container.updateBrandDescriptionUseCase.execute(id, description);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async createAttribute(input: CreateAttributeInput): Promise<Attribute> {
    const res = await this.container.createAttributeUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async listAttributes(query?: CatalogPageQuery): Promise<Attribute[]> {
    const res = await this.container.listAttributesUseCase.execute(query);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public createSupplier(input: CreateSupplierInput): Promise<Supplier> {
    return this.container.createSupplierUseCase.execute(input);
  }

  public listSuppliers(query?: CatalogPageQuery): Promise<Supplier[]> {
    return this.container.listSuppliersUseCase.execute(query);
  }

  public createProductVariant(input: CreateProductVariantInput): Promise<ProductVariant> {
    return this.container.createProductVariantUseCase.execute(input);
  }

  public listProductVariants(query?: CatalogPageQuery): Promise<ProductVariant[]> {
    return this.container.listProductVariantsUseCase.execute(query);
  }

  public updateTaxonomy(input: CatalogTaxonomyUpdate): Promise<void> {
    return this.container.manageCatalogTaxonomyUseCase.update(input);
  }

  public deleteTaxonomy(kind: CatalogTaxonomyKind, id: string): Promise<void> {
    return this.container.manageCatalogTaxonomyUseCase.delete(kind, id);
  }

  public listCollections(query?: CatalogPageQuery): Promise<Collection[]> { return this.container.manageCollectionUseCase.list(query); }
  public getCollectionBySlug(slug: string): Promise<Collection> { return this.container.manageCollectionUseCase.getBySlug(slug); }
  public findCollectionBySlug(slug: string): Promise<Collection | null> { return this.container.manageCollectionUseCase.findBySlug(slug); }
  public getCollectionById(id: string): Promise<Collection> { return this.container.manageCollectionUseCase.getById(id); }
  public saveCollection(input: CollectionInput, id?: string): Promise<Collection> { return this.container.manageCollectionUseCase.save(input, id); }
  public deleteCollection(id: string): Promise<void> { return this.container.manageCollectionUseCase.delete(id); }

  public listProductTags(includeInactive = true): Promise<ProductTag[]> { return this.container.manageProductTagsUseCase.list(includeInactive); }
  public saveProductTag(input: SaveProductTagInput): Promise<ProductTag> { return this.container.manageProductTagsUseCase.save(input); }
  public deleteProductTag(id: string): Promise<void> { return this.container.manageProductTagsUseCase.delete(id); }

  public async previewLegacyPriceMigration(taxRateBasisPoints: number): Promise<LegacyPriceMigrationPreview> {
    return this.container.migrateLegacyProductPricesUseCase.preview(taxRateBasisPoints);
  }

  public async migrateLegacyPrices(taxRateBasisPoints: number, expectedCount: number, expectedFingerprint: string): Promise<number> {
    return this.container.migrateLegacyProductPricesUseCase.execute(taxRateBasisPoints, expectedCount, expectedFingerprint);
  }
}

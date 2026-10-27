import { Env } from '../../platform/Env.js';
import { D1ProductRepository } from './infrastructure/persistence/d1/repositories/D1ProductRepository.js';
import { D1CategoryRepository } from './infrastructure/persistence/d1/repositories/D1CategoryRepository.js';
import { D1BrandRepository } from './infrastructure/persistence/d1/repositories/D1BrandRepository.js';
import { D1AttributeRepository } from './infrastructure/persistence/d1/repositories/D1AttributeRepository.js';
import { CreateProductUseCase } from './application/use-cases/CreateProductUseCase.js';
import { UpdateProductUseCase } from './application/use-cases/UpdateProductUseCase.js';
import { DeleteProductUseCase } from './application/use-cases/DeleteProductUseCase.js';
import { GetProductBySlugUseCase } from './application/use-cases/GetProductBySlugUseCase.js';
import { GetProductByIdUseCase } from './application/use-cases/GetProductByIdUseCase.js';
import { ListProductsUseCase } from './application/use-cases/ListProductsUseCase.js';
import { CreateCategoryUseCase } from './application/use-cases/CreateCategoryUseCase.js';
import { ListCategoriesUseCase } from './application/use-cases/ListCategoriesUseCase.js';
import { DeleteCategoryUseCase } from './application/use-cases/DeleteCategoryUseCase.js';
import { CreateBrandUseCase } from './application/use-cases/CreateBrandUseCase.js';
import { ListBrandsUseCase } from './application/use-cases/ListBrandsUseCase.js';
import { CreateAttributeUseCase } from './application/use-cases/CreateAttributeUseCase.js';
import { ListAttributesUseCase } from './application/use-cases/ListAttributesUseCase.js';
import { MigrateLegacyProductPricesUseCase } from './application/use-cases/MigrateLegacyProductPricesUseCase.js';
import { UpdateBrandDescriptionUseCase } from './application/use-cases/UpdateBrandDescriptionUseCase.js';
import { D1SupplierRepository } from './infrastructure/persistence/d1/repositories/D1SupplierRepository.js';
import { D1ProductVariantRepository } from './infrastructure/persistence/d1/repositories/D1ProductVariantRepository.js';
import { CreateSupplierUseCase } from './application/use-cases/CreateSupplierUseCase.js';
import { ListSuppliersUseCase } from './application/use-cases/ListSuppliersUseCase.js';
import { CreateProductVariantUseCase } from './application/use-cases/CreateProductVariantUseCase.js';
import { ListProductVariantsUseCase } from './application/use-cases/ListProductVariantsUseCase.js';
import { ManageCatalogTaxonomyUseCase } from './application/use-cases/ManageCatalogTaxonomyUseCase.js';
import { D1CollectionRepository } from './infrastructure/persistence/d1/repositories/D1CollectionRepository.js';
import { ManageCollectionUseCase } from './application/use-cases/ManageCollectionUseCase.js';
import { D1ProductTagRepository } from './infrastructure/persistence/d1/repositories/D1ProductTagRepository.js';
import { ManageProductTagsUseCase } from './application/use-cases/ManageProductTagsUseCase.js';
import { D1ProductLandingConfigRepository } from './infrastructure/persistence/d1/repositories/D1ProductLandingConfigRepository.js';
import { GetProductLandingConfigUseCase } from './application/use-cases/GetProductLandingConfigUseCase.js';
import { SaveProductLandingConfigUseCase } from './application/use-cases/SaveProductLandingConfigUseCase.js';

export interface CatalogModuleContainer {
  createProductUseCase: CreateProductUseCase;
  updateProductUseCase: UpdateProductUseCase;
  deleteProductUseCase: DeleteProductUseCase;
  getProductBySlugUseCase: GetProductBySlugUseCase;
  getProductByIdUseCase: GetProductByIdUseCase;
  listProductsUseCase: ListProductsUseCase;
  createCategoryUseCase: CreateCategoryUseCase;
  listCategoriesUseCase: ListCategoriesUseCase;
  deleteCategoryUseCase: DeleteCategoryUseCase;
  createBrandUseCase: CreateBrandUseCase;
  listBrandsUseCase: ListBrandsUseCase;
  updateBrandDescriptionUseCase: UpdateBrandDescriptionUseCase;
  createAttributeUseCase: CreateAttributeUseCase;
  listAttributesUseCase: ListAttributesUseCase;
  migrateLegacyProductPricesUseCase: MigrateLegacyProductPricesUseCase;
  createSupplierUseCase: CreateSupplierUseCase;
  listSuppliersUseCase: ListSuppliersUseCase;
  createProductVariantUseCase: CreateProductVariantUseCase;
  listProductVariantsUseCase: ListProductVariantsUseCase;
  manageCatalogTaxonomyUseCase: ManageCatalogTaxonomyUseCase;
  manageCollectionUseCase: ManageCollectionUseCase;
  manageProductTagsUseCase: ManageProductTagsUseCase;
  getProductLandingConfigUseCase: GetProductLandingConfigUseCase;
  saveProductLandingConfigUseCase: SaveProductLandingConfigUseCase;
}

export function createCatalogModule(env: Env): CatalogModuleContainer {
  const productRepo = new D1ProductRepository(env.DB);
  const categoryRepo = new D1CategoryRepository(env.DB);
  const brandRepo = new D1BrandRepository(env.DB);
  const attributeRepo = new D1AttributeRepository(env.DB);
  const supplierRepo = new D1SupplierRepository(env.DB);
  const variantRepo = new D1ProductVariantRepository(env.DB);
  const collectionRepo = new D1CollectionRepository(env.DB);
  const productTagRepo = new D1ProductTagRepository(env.DB);
  const productLandingConfigRepo = new D1ProductLandingConfigRepository(env.DB);

  return {
    createProductUseCase: new CreateProductUseCase(productRepo),
    updateProductUseCase: new UpdateProductUseCase(productRepo),
    deleteProductUseCase: new DeleteProductUseCase(productRepo),
    getProductBySlugUseCase: new GetProductBySlugUseCase(productRepo),
    getProductByIdUseCase: new GetProductByIdUseCase(productRepo),
    listProductsUseCase: new ListProductsUseCase(productRepo),
    createCategoryUseCase: new CreateCategoryUseCase(categoryRepo),
    listCategoriesUseCase: new ListCategoriesUseCase(categoryRepo),
    deleteCategoryUseCase: new DeleteCategoryUseCase(categoryRepo),
    createBrandUseCase: new CreateBrandUseCase(brandRepo),
    listBrandsUseCase: new ListBrandsUseCase(brandRepo),
    updateBrandDescriptionUseCase: new UpdateBrandDescriptionUseCase(brandRepo),
    createAttributeUseCase: new CreateAttributeUseCase(attributeRepo),
    listAttributesUseCase: new ListAttributesUseCase(attributeRepo),
    migrateLegacyProductPricesUseCase: new MigrateLegacyProductPricesUseCase(productRepo),
    createSupplierUseCase: new CreateSupplierUseCase(supplierRepo),
    listSuppliersUseCase: new ListSuppliersUseCase(supplierRepo),
    createProductVariantUseCase: new CreateProductVariantUseCase(variantRepo, productRepo),
    listProductVariantsUseCase: new ListProductVariantsUseCase(variantRepo),
    manageCatalogTaxonomyUseCase: new ManageCatalogTaxonomyUseCase(categoryRepo, brandRepo, attributeRepo, supplierRepo, variantRepo),
    manageCollectionUseCase: new ManageCollectionUseCase(collectionRepo, productRepo),
    manageProductTagsUseCase: new ManageProductTagsUseCase(productTagRepo),
    getProductLandingConfigUseCase: new GetProductLandingConfigUseCase(productLandingConfigRepo),
    saveProductLandingConfigUseCase: new SaveProductLandingConfigUseCase(productRepo, productLandingConfigRepo),
  };
}

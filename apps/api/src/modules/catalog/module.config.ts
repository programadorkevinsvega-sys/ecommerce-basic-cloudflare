import { Env } from '../../platform/Env.js';
import { D1ProductRepository } from './infrastructure/persistence/d1/repositories/D1ProductRepository.js';
import { D1CategoryRepository } from './infrastructure/persistence/d1/repositories/D1CategoryRepository.js';
import { D1BrandRepository } from './infrastructure/persistence/d1/repositories/D1BrandRepository.js';
import { D1AttributeRepository } from './infrastructure/persistence/d1/repositories/D1AttributeRepository.js';
import { CreateProductUseCase } from './application/use-cases/CreateProductUseCase.js';
import { UpdateProductUseCase } from './application/use-cases/UpdateProductUseCase.js';
import { DeleteProductUseCase } from './application/use-cases/DeleteProductUseCase.js';
import { GetProductBySlugUseCase } from './application/use-cases/GetProductBySlugUseCase.js';
import { ListProductsUseCase } from './application/use-cases/ListProductsUseCase.js';
import { CreateCategoryUseCase } from './application/use-cases/CreateCategoryUseCase.js';
import { ListCategoriesUseCase } from './application/use-cases/ListCategoriesUseCase.js';
import { DeleteCategoryUseCase } from './application/use-cases/DeleteCategoryUseCase.js';
import { CreateBrandUseCase } from './application/use-cases/CreateBrandUseCase.js';
import { ListBrandsUseCase } from './application/use-cases/ListBrandsUseCase.js';
import { CreateAttributeUseCase } from './application/use-cases/CreateAttributeUseCase.js';
import { ListAttributesUseCase } from './application/use-cases/ListAttributesUseCase.js';

export interface CatalogModuleContainer {
  createProductUseCase: CreateProductUseCase;
  updateProductUseCase: UpdateProductUseCase;
  deleteProductUseCase: DeleteProductUseCase;
  getProductBySlugUseCase: GetProductBySlugUseCase;
  listProductsUseCase: ListProductsUseCase;
  createCategoryUseCase: CreateCategoryUseCase;
  listCategoriesUseCase: ListCategoriesUseCase;
  deleteCategoryUseCase: DeleteCategoryUseCase;
  createBrandUseCase: CreateBrandUseCase;
  listBrandsUseCase: ListBrandsUseCase;
  createAttributeUseCase: CreateAttributeUseCase;
  listAttributesUseCase: ListAttributesUseCase;
}

export function createCatalogModule(env: Env): CatalogModuleContainer {
  const productRepo = new D1ProductRepository(env.DB);
  const categoryRepo = new D1CategoryRepository(env.DB);
  const brandRepo = new D1BrandRepository(env.DB);
  const attributeRepo = new D1AttributeRepository(env.DB);

  return {
    createProductUseCase: new CreateProductUseCase(productRepo),
    updateProductUseCase: new UpdateProductUseCase(productRepo),
    deleteProductUseCase: new DeleteProductUseCase(productRepo),
    getProductBySlugUseCase: new GetProductBySlugUseCase(productRepo),
    listProductsUseCase: new ListProductsUseCase(productRepo),
    createCategoryUseCase: new CreateCategoryUseCase(categoryRepo),
    listCategoriesUseCase: new ListCategoriesUseCase(categoryRepo),
    deleteCategoryUseCase: new DeleteCategoryUseCase(categoryRepo),
    createBrandUseCase: new CreateBrandUseCase(brandRepo),
    listBrandsUseCase: new ListBrandsUseCase(brandRepo),
    createAttributeUseCase: new CreateAttributeUseCase(attributeRepo),
    listAttributesUseCase: new ListAttributesUseCase(attributeRepo),
  };
}

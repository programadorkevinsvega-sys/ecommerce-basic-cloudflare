import { Env } from '../../platform/Env.js';
import { D1ProductRepository } from './infrastructure/persistence/d1/repositories/D1ProductRepository.js';
import { D1CategoryRepository } from './infrastructure/persistence/d1/repositories/D1CategoryRepository.js';
import { CreateProductUseCase } from './application/use-cases/CreateProductUseCase.js';
import { GetProductBySlugUseCase } from './application/use-cases/GetProductBySlugUseCase.js';
import { ListProductsUseCase } from './application/use-cases/ListProductsUseCase.js';
import { CreateCategoryUseCase } from './application/use-cases/CreateCategoryUseCase.js';

export interface CatalogModuleContainer {
  createProductUseCase: CreateProductUseCase;
  getProductBySlugUseCase: GetProductBySlugUseCase;
  listProductsUseCase: ListProductsUseCase;
  createCategoryUseCase: CreateCategoryUseCase;
}

export function createCatalogModule(env: Env): CatalogModuleContainer {
  const productRepo = new D1ProductRepository(env.DB);
  const categoryRepo = new D1CategoryRepository(env.DB);

  return {
    createProductUseCase: new CreateProductUseCase(productRepo),
    getProductBySlugUseCase: new GetProductBySlugUseCase(productRepo),
    listProductsUseCase: new ListProductsUseCase(productRepo),
    createCategoryUseCase: new CreateCategoryUseCase(categoryRepo),
  };
}

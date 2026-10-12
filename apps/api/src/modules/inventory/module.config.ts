import { Env } from '../../platform/Env.js';
import { D1InventoryRepository } from './infrastructure/persistence/d1/repositories/D1InventoryRepository.js';
import { D1InventoryOutboxRepository } from './infrastructure/persistence/d1/repositories/D1InventoryOutboxRepository.js';
import { GetProductStockUseCase } from './application/use-cases/GetProductStockUseCase.js';
import { ReserveStockUseCase } from './application/use-cases/ReserveStockUseCase.js';
import { ReleaseStockUseCase } from './application/use-cases/ReleaseStockUseCase.js';
import { AdjustStockUseCase } from './application/use-cases/AdjustStockUseCase.js';
import { ListStockUseCase } from './application/use-cases/ListStockUseCase.js';
import { ConsumeStockUseCase } from './application/use-cases/ConsumeStockUseCase.js';

export interface InventoryModuleContainer {
  getProductStockUseCase: GetProductStockUseCase;
  reserveStockUseCase: ReserveStockUseCase;
  releaseStockUseCase: ReleaseStockUseCase;
  adjustStockUseCase: AdjustStockUseCase;
  listStockUseCase: ListStockUseCase;
  consumeStockUseCase: ConsumeStockUseCase;
}

export function createInventoryModule(env: Env): InventoryModuleContainer {
  const repo = new D1InventoryRepository(env.DB);
  const outbox = new D1InventoryOutboxRepository(env.DB);

  return {
    getProductStockUseCase: new GetProductStockUseCase(repo),
    reserveStockUseCase: new ReserveStockUseCase(repo, outbox),
    releaseStockUseCase: new ReleaseStockUseCase(repo, outbox),
    adjustStockUseCase: new AdjustStockUseCase(repo, outbox),
    listStockUseCase: new ListStockUseCase(repo),
    consumeStockUseCase: new ConsumeStockUseCase(repo, outbox),
  };
}

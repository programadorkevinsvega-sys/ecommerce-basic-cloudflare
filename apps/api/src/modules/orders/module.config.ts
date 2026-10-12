import { Env } from '../../platform/Env.js';
import { D1OrderRepository } from './infrastructure/persistence/d1/repositories/D1OrderRepository.js';
import { D1OrderOutboxRepository } from './infrastructure/persistence/d1/repositories/D1OrderOutboxRepository.js';
import { EvaluateCheckoutPolicyUseCase } from './application/use-cases/EvaluateCheckoutPolicyUseCase.js';
import { CreateOrderUseCase } from './application/use-cases/CreateOrderUseCase.js';
import { GetOrderUseCase } from './application/use-cases/GetOrderUseCase.js';
import { ListOrdersUseCase } from './application/use-cases/ListOrdersUseCase.js';
import { UpdateOrderStatusUseCase } from './application/use-cases/UpdateOrderStatusUseCase.js';

export interface OrdersModuleContainer {
  evaluateCheckoutPolicyUseCase: EvaluateCheckoutPolicyUseCase;
  createOrderUseCase: CreateOrderUseCase;
  getOrderUseCase: GetOrderUseCase;
  listOrdersUseCase: ListOrdersUseCase;
  updateOrderStatusUseCase: UpdateOrderStatusUseCase;
}

export function createOrdersModule(env: Env): OrdersModuleContainer {
  const repo = new D1OrderRepository(env.DB);
  const outbox = new D1OrderOutboxRepository(env.DB);

  return {
    evaluateCheckoutPolicyUseCase: new EvaluateCheckoutPolicyUseCase(),
    createOrderUseCase: new CreateOrderUseCase(repo, outbox),
    getOrderUseCase: new GetOrderUseCase(repo),
    listOrdersUseCase: new ListOrdersUseCase(repo),
    updateOrderStatusUseCase: new UpdateOrderStatusUseCase(repo, outbox),
  };
}

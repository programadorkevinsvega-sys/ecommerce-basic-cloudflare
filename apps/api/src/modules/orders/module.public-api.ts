import { OrdersModuleContainer } from './module.config.js';
import { Order } from './domain/entities/Order.js';
import { CheckoutEvaluationInput, CheckoutEvaluationResult } from './domain/services/OrdersCheckoutPolicy.js';
import { CreateOrderCommand } from './application/use-cases/CreateOrderUseCase.js';
import { UpdateOrderStatusCommand } from './application/use-cases/UpdateOrderStatusUseCase.js';

export class OrdersPublicApi {
  private readonly container: OrdersModuleContainer;

  public constructor(container: OrdersModuleContainer) {
    this.container = container;
  }

  public evaluateCheckoutPolicy(input: CheckoutEvaluationInput): CheckoutEvaluationResult {
    return this.container.evaluateCheckoutPolicyUseCase.execute(input);
  }

  public async createOrder(cmd: CreateOrderCommand): Promise<Order> {
    return this.container.createOrderUseCase.execute(cmd);
  }

  public async getOrder(orderId: string): Promise<Order | null> {
    return this.container.getOrderUseCase.execute(orderId);
  }

  public async listOrders(filters?: { customerId?: string; status?: string; limit?: number; offset?: number }): Promise<Order[]> {
    return this.container.listOrdersUseCase.execute(filters);
  }

  public async updateOrderStatus(cmd: UpdateOrderStatusCommand): Promise<Order> {
    return this.container.updateOrderStatusUseCase.execute(cmd);
  }
}

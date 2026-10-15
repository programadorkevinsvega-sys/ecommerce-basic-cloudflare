import { OrdersGateway } from './OrdersGateway.js';
import { OrdersPublicApi } from '../../../modules/orders/module.public-api.js';
import { Order } from '../../../modules/orders/domain/entities/Order.js';
import { CheckoutEvaluationInput, CheckoutEvaluationResult } from '../../../modules/orders/domain/services/OrdersCheckoutPolicy.js';
import { CreateOrderCommand } from '../../../modules/orders/application/use-cases/CreateOrderUseCase.js';
import { UpdateOrderStatusCommand } from '../../../modules/orders/application/use-cases/UpdateOrderStatusUseCase.js';

export class InProcessOrdersGateway implements OrdersGateway {
  private readonly publicApi: OrdersPublicApi;

  public constructor(publicApi: OrdersPublicApi) {
    this.publicApi = publicApi;
  }

  public async evaluateCheckoutPolicy(input: CheckoutEvaluationInput): Promise<CheckoutEvaluationResult> {
    return this.publicApi.evaluateCheckoutPolicy(input);
  }

  public async createOrder(cmd: CreateOrderCommand): Promise<Order> {
    return this.publicApi.createOrder(cmd);
  }

  public async getOrder(orderId: string): Promise<Order | null> {
    return this.publicApi.getOrder(orderId);
  }

  public async listOrders(filters?: { customerId?: string; status?: string; limit?: number; offset?: number }): Promise<Order[]> {
    return this.publicApi.listOrders(filters);
  }

  public async updateOrderStatus(cmd: UpdateOrderStatusCommand): Promise<Order> {
    return this.publicApi.updateOrderStatus(cmd);
  }
  public hasDeliveredProductPurchase(customerId:string,productId:string):Promise<boolean>{return this.publicApi.hasDeliveredProductPurchase(customerId,productId);}
  public getDeliveredProductPaymentMethod(customerId:string,productId:string):Promise<'wompi'|'cash_on_delivery'|null>{return this.publicApi.getDeliveredProductPaymentMethod(customerId,productId);}
  public getOrderTracking(orderId: string, tokenHash: string) {
    return this.publicApi.getOrderTracking(orderId, tokenHash);
  }

  public getCustomerOrderTracking(orderId: string, customerId: string) {
    return this.publicApi.getCustomerOrderTracking(orderId, customerId);
  }
}

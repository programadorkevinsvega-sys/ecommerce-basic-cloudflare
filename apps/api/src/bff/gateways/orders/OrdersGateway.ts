import { Order } from '../../../modules/orders/domain/entities/Order.js';
import { CheckoutEvaluationInput, CheckoutEvaluationResult } from '../../../modules/orders/domain/services/OrdersCheckoutPolicy.js';
import { CreateOrderCommand } from '../../../modules/orders/application/use-cases/CreateOrderUseCase.js';
import { UpdateOrderStatusCommand } from '../../../modules/orders/application/use-cases/UpdateOrderStatusUseCase.js';
import { OrderTrackingRecord } from '../../../modules/orders/domain/ports/IOrderTrackingRepository.js';

export interface OrdersGateway {
  evaluateCheckoutPolicy(input: CheckoutEvaluationInput): Promise<CheckoutEvaluationResult>;
  createOrder(cmd: CreateOrderCommand): Promise<Order>;
  getOrder(orderId: string): Promise<Order | null>;
  listOrders(filters?: { customerId?: string; status?: string; limit?: number; offset?: number }): Promise<Order[]>;
  updateOrderStatus(cmd: UpdateOrderStatusCommand): Promise<Order>;
  hasDeliveredProductPurchase(customerId:string,productId:string):Promise<boolean>;
  getDeliveredProductPaymentMethod(customerId:string,productId:string):Promise<'wompi'|'cash_on_delivery'|null>;
  getOrderTracking(orderId: string, tokenHash: string): Promise<OrderTrackingRecord | null>;
}

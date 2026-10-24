import { Order } from '../../../modules/orders/domain/entities/Order.js';
import { CheckoutEvaluationInput, CheckoutEvaluationResult, FreeShippingItemCandidate, FreeShippingRuleCandidate } from '../../../modules/orders/domain/services/OrdersCheckoutPolicy.js';
import { CreateOrderCommand } from '../../../modules/orders/application/use-cases/CreateOrderUseCase.js';
import { UpdateOrderStatusCommand } from '../../../modules/orders/application/use-cases/UpdateOrderStatusUseCase.js';
import { AdminOrderTrackingPage, AdminOrderTrackingRecord, OrderShippingDetails, OrderTrackingRecord } from '../../../modules/orders/domain/ports/IOrderTrackingRepository.js';
import { LocalDeliveryLabelPage } from '../../../modules/orders/domain/ports/LocalDeliveryLabel.js';
import { LocalCodCollectionCandidate } from '../../../modules/orders/domain/ports/LocalCodCollectionCandidate.js';
import { AdminOrderListPage, AdminOrderListQuery } from '../../../modules/orders/domain/ports/AdminOrderListPage.js';

export interface OrdersGateway {
  evaluateCheckoutPolicy(input: CheckoutEvaluationInput): Promise<CheckoutEvaluationResult>;
  evaluateFreeShippingEligibility(input: { subtotalCents: number; discountCents: number; rules: FreeShippingRuleCandidate[]; items: FreeShippingItemCandidate[]; now?: string }): Promise<FreeShippingRuleCandidate | null>;
  createOrder(cmd: CreateOrderCommand): Promise<Order>;
  getOrder(orderId: string): Promise<Order | null>;
  listOrders(filters?: { customerId?: string; status?: string; limit?: number; offset?: number }): Promise<Order[]>;
  listAdminOrders(query: AdminOrderListQuery): Promise<AdminOrderListPage>;
  updateOrderStatus(cmd: UpdateOrderStatusCommand): Promise<Order>;
  hasDeliveredProductPurchase(customerId:string,productId:string):Promise<boolean>;
  getDeliveredProductPaymentMethod(customerId:string,productId:string):Promise<'wompi'|'cash_on_delivery'|null>;
  getOrderTracking(orderId: string, tokenHash: string): Promise<OrderTrackingRecord | null>;
  getCustomerOrderTracking(orderId: string, customerId: string): Promise<OrderTrackingRecord | null>;
  getAdminOrderTracking(orderId: string): Promise<AdminOrderTrackingRecord | null>;
  listAdminOrderTracking(input: { page: number; pageSize: number; query?: string; status?: string }): Promise<AdminOrderTrackingPage>;
  saveOrderShippingDetails(orderId: string, details: OrderShippingDetails): Promise<boolean>;
  listLocalDeliveryLabels(page: number, pageSize: number, unprinted?: boolean): Promise<LocalDeliveryLabelPage>;
  markLocalDeliveryLabelPrinted(orderId: string, actorId: string): Promise<boolean>;
  listLocalCodCollectionCandidates(limit: number, offset: number): Promise<LocalCodCollectionCandidate[]>;
  countLocalCodCollectionCandidates(): Promise<number>;
}

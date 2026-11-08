import { Order } from '../entities/Order.js';

export interface OrderHistoryRecord {
  id?: string;
  orderId: string;
  fromStatus?: string | null;
  toStatus: string;
  note?: string;
  actor: string;
  createdAt?: string;
}

export interface OrderOutboxEvent {
  name: string;
  payload: Record<string, unknown>;
}

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
  saveAggregate(order: Order, history: OrderHistoryRecord, event: OrderOutboxEvent): Promise<void>;
  list(filters?: { customerId?: string; status?: string; limit?: number; offset?: number }): Promise<Order[]>;
  hasDeliveredProductPurchase(customerId:string,productId:string):Promise<boolean>;
  getDeliveredProductPaymentMethod(customerId:string,productId:string):Promise<'wompi'|'cash_on_delivery'|null>;
}

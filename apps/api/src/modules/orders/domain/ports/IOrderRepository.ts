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

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
  addHistory(record: OrderHistoryRecord): Promise<void>;
  list(filters?: { customerId?: string; status?: string; limit?: number; offset?: number }): Promise<Order[]>;
  hasDeliveredProductPurchase(customerId:string,productId:string):Promise<boolean>;
  getDeliveredProductPaymentMethod(customerId:string,productId:string):Promise<'wompi'|'cash_on_delivery'|null>;
}

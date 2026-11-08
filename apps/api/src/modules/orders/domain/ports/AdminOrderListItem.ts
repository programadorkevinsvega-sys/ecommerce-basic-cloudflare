import { OrderPaymentStatus, OrderStatus } from '../entities/Order.js';

export interface AdminOrderListItem {
  id: string;
  customerName: string;
  customerPhone: string;
  totalCents: number;
  paymentMethod: 'wompi' | 'cash_on_delivery';
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  createdAt: string;
}

import { OrderPaymentStatus, OrderStatus } from '../entities/Order.js';

export interface AdminOrderSummaryItem {
  id: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: { municipality?: string; department?: string };
  totalCents: number;
  paymentMethod: 'wompi' | 'cash_on_delivery';
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  createdAt: string;
}

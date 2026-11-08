import { AdminOrderListItem } from './AdminOrderListItem.js';
import { OrderPaymentStatus, OrderStatus } from '../entities/Order.js';

export interface AdminOrderListQuery {
  page: number;
  pageSize: number;
  status?: OrderStatus;
  paymentStatus?: OrderPaymentStatus;
  paymentMethod?: 'wompi' | 'cash_on_delivery';
  query?: string;
}

export interface AdminOrderListPage {
  items: AdminOrderListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

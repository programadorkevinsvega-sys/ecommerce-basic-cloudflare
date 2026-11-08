import { AdminOrderListPage, AdminOrderListQuery } from './AdminOrderListPage.js';
import { AdminOrderSummaryItem } from './AdminOrderSummaryItem.js';

export interface IAdminOrderListRepository {
  list(query: AdminOrderListQuery): Promise<AdminOrderListPage>;
  summary(limit: number): Promise<AdminOrderSummaryItem[]>;
}

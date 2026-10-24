import { AdminOrderListPage, AdminOrderListQuery } from './AdminOrderListPage.js';

export interface IAdminOrderListRepository {
  list(query: AdminOrderListQuery): Promise<AdminOrderListPage>;
}

import { AdminOrderListPage, AdminOrderListQuery } from '../../domain/ports/AdminOrderListPage.js';
import { IAdminOrderListRepository } from '../../domain/ports/IAdminOrderListRepository.js';
import { AdminOrderSummaryItem } from '../../domain/ports/AdminOrderSummaryItem.js';

export class ListAdminOrdersUseCase {
  constructor(private readonly repository: IAdminOrderListRepository) {}

  public execute(query: AdminOrderListQuery): Promise<AdminOrderListPage> {
    return this.repository.list(query);
  }

  public summary(limit: number): Promise<AdminOrderSummaryItem[]> {
    return this.repository.summary(Math.min(Math.max(limit, 1), 100));
  }
}

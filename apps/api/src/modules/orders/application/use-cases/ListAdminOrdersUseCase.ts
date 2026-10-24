import { AdminOrderListPage, AdminOrderListQuery } from '../../domain/ports/AdminOrderListPage.js';
import { IAdminOrderListRepository } from '../../domain/ports/IAdminOrderListRepository.js';

export class ListAdminOrdersUseCase {
  constructor(private readonly repository: IAdminOrderListRepository) {}

  public execute(query: AdminOrderListQuery): Promise<AdminOrderListPage> {
    return this.repository.list(query);
  }
}

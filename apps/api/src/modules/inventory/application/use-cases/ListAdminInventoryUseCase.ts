import { AdminInventoryPage, AdminInventoryQuery } from '../../domain/ports/AdminInventoryPage.js';
import { IAdminInventoryRepository } from '../../domain/ports/IAdminInventoryRepository.js';

export class ListAdminInventoryUseCase {
  constructor(private readonly repository: IAdminInventoryRepository) {}
  public execute(query: AdminInventoryQuery): Promise<AdminInventoryPage> { return this.repository.list(query); }
}

import { Order } from '../../domain/entities/Order.js';
import { IOrderRepository } from '../../domain/ports/IOrderRepository.js';

export class ListOrdersUseCase {
  private readonly repo: IOrderRepository;

  public constructor(repo: IOrderRepository) {
    this.repo = repo;
  }

  public async execute(filters?: { customerId?: string; status?: string; limit?: number; offset?: number }): Promise<Order[]> {
    return this.repo.list(filters);
  }
}

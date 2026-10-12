import { Order } from '../../domain/entities/Order.js';
import { IOrderRepository } from '../../domain/ports/IOrderRepository.js';

export class GetOrderUseCase {
  private readonly repo: IOrderRepository;

  public constructor(repo: IOrderRepository) {
    this.repo = repo;
  }

  public async execute(id: string): Promise<Order | null> {
    return this.repo.findById(id);
  }
}

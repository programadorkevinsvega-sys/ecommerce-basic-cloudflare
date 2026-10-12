import { InventoryStock } from '../../domain/entities/InventoryStock.js';
import { IInventoryRepository } from '../../domain/ports/IInventoryRepository.js';

export class ListStockUseCase {
  private readonly repo: IInventoryRepository;

  public constructor(repo: IInventoryRepository) {
    this.repo = repo;
  }

  public async execute(): Promise<InventoryStock[]> {
    return this.repo.listStocks();
  }
}

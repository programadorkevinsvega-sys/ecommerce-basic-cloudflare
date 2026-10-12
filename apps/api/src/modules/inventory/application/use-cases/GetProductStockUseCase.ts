import { InventoryStock } from '../../domain/entities/InventoryStock.js';
import { IInventoryRepository } from '../../domain/ports/IInventoryRepository.js';

export class GetProductStockUseCase {
  private readonly repo: IInventoryRepository;

  public constructor(repo: IInventoryRepository) {
    this.repo = repo;
  }

  public async execute(productId: string): Promise<InventoryStock> {
    const stock = await this.repo.getStock(productId);
    if (!stock) {
      return new InventoryStock({
        productId,
        quantity: 0,
        reservedQuantity: 0,
        updatedAt: new Date().toISOString(),
      });
    }
    return stock;
  }
}

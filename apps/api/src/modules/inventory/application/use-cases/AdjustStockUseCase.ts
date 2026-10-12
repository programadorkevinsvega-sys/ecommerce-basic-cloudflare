import { InventoryStock } from '../../domain/entities/InventoryStock.js';
import { IInventoryOutboxRepository } from '../../domain/ports/IInventoryOutboxRepository.js';
import { IInventoryRepository } from '../../domain/ports/IInventoryRepository.js';

export interface AdjustStockCommand {
  productId: string;
  quantity: number;
  reason: string;
}

export class AdjustStockUseCase {
  private readonly repo: IInventoryRepository;
  private readonly outbox: IInventoryOutboxRepository;

  public constructor(repo: IInventoryRepository, outbox: IInventoryOutboxRepository) {
    this.repo = repo;
    this.outbox = outbox;
  }

  public async execute(cmd: AdjustStockCommand): Promise<InventoryStock> {
    let stock = await this.repo.getStock(cmd.productId);
    const now = new Date().toISOString();

    if (!stock) {
      stock = new InventoryStock({
        productId: cmd.productId,
        quantity: cmd.quantity,
        reservedQuantity: 0,
        updatedAt: now,
      });
    } else {
      stock.adjust(cmd.quantity);
    }

    await this.repo.saveStock(stock);
    await this.repo.recordMovement({
      id: crypto.randomUUID(),
      productId: cmd.productId,
      type: 'adjustment',
      quantity: cmd.quantity,
      reason: cmd.reason,
      createdAt: now,
    });

    await this.outbox.publish('inventory.stock.adjusted.v1', {
      productId: cmd.productId,
      quantity: cmd.quantity,
      reason: cmd.reason,
    });

    return stock;
  }
}

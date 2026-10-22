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
    if (!cmd.productId.trim() || !Number.isSafeInteger(cmd.quantity) || cmd.quantity < 0 || cmd.quantity > 100000) {
      throw new Error('Producto y stock objetivo válido son obligatorios');
    }
    const now = new Date().toISOString();
    // La cantidad es un objetivo absoluto, no un delta. D1 valida el límite respecto a las reservas
    // en la misma sentencia que actualiza quantity para no sobrescribir reserved_quantity concurrente.
    const stock = await this.repo.setStockQuantity(cmd.productId, cmd.quantity);
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

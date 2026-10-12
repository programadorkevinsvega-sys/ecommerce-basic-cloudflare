import { IInventoryOutboxRepository } from '../../domain/ports/IInventoryOutboxRepository.js';
import { IInventoryRepository } from '../../domain/ports/IInventoryRepository.js';

export interface ReleaseStockCommand {
  orderId: string;
  items: Array<{ productId: string; quantity: number }>;
}

export class ReleaseStockUseCase {
  private readonly repo: IInventoryRepository;
  private readonly outbox: IInventoryOutboxRepository;

  public constructor(repo: IInventoryRepository, outbox: IInventoryOutboxRepository) {
    this.repo = repo;
    this.outbox = outbox;
  }

  public async execute(cmd: ReleaseStockCommand): Promise<void> {
    for (const item of cmd.items) {
      const stock = await this.repo.getStock(item.productId);
      if (stock) {
        stock.release(item.quantity);
        await this.repo.saveStock(stock);
        await this.repo.recordMovement({
          id: crypto.randomUUID(),
          productId: item.productId,
          type: 'release',
          quantity: item.quantity,
          referenceId: cmd.orderId,
          reason: `Liberación de reserva de orden ${cmd.orderId}`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    await this.repo.releaseReservation(cmd.orderId);
    await this.outbox.publish('inventory.stock.released.v1', {
      orderId: cmd.orderId,
      items: cmd.items,
    });
  }
}

import { IInventoryOutboxRepository } from '../../domain/ports/IInventoryOutboxRepository.js';
import { IInventoryRepository } from '../../domain/ports/IInventoryRepository.js';

export interface ConsumeStockCommand {
  orderId: string;
  items: Array<{ productId: string; quantity: number }>;
}

export class ConsumeStockUseCase {
  private readonly repo: IInventoryRepository;
  private readonly outbox: IInventoryOutboxRepository;

  public constructor(repo: IInventoryRepository, outbox: IInventoryOutboxRepository) {
    this.repo = repo;
    this.outbox = outbox;
  }

  public async execute(cmd: ConsumeStockCommand): Promise<void> {
    for (const item of cmd.items) {
      const stock = await this.repo.getStock(item.productId);
      if (stock) {
        stock.consume(item.quantity);
        await this.repo.saveStock(stock);
        await this.repo.recordMovement({
          id: crypto.randomUUID(),
          productId: item.productId,
          type: 'sale',
          quantity: item.quantity,
          referenceId: cmd.orderId,
          reason: `Venta confirmada orden ${cmd.orderId}`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    await this.repo.confirmReservation(cmd.orderId);
    await this.outbox.publish('inventory.stock.consumed.v1', {
      orderId: cmd.orderId,
      items: cmd.items,
    });
  }
}

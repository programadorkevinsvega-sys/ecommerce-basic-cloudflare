import { IInventoryOutboxRepository } from '../../domain/ports/IInventoryOutboxRepository.js';
import { IInventoryRepository } from '../../domain/ports/IInventoryRepository.js';

export interface ReserveStockCommand {
  orderId: string;
  items: Array<{ productId: string; quantity: number }>;
  ttlMinutes?: number;
}

export class ReserveStockUseCase {
  private readonly repo: IInventoryRepository;
  private readonly outbox: IInventoryOutboxRepository;

  public constructor(repo: IInventoryRepository, outbox: IInventoryOutboxRepository) {
    this.repo = repo;
    this.outbox = outbox;
  }

  public async execute(cmd: ReserveStockCommand): Promise<{ success: boolean; error?: string }> {
    const ttl = cmd.ttlMinutes || 30;
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString();

    for (const item of cmd.items) {
      const stock = await this.repo.getStock(item.productId);
      if (!stock || !stock.canReserve(item.quantity)) {
        return {
          success: false,
          error: `Stock insuficiente para el producto ${item.productId} (solicitado: ${item.quantity})`,
        };
      }
    }

    for (const item of cmd.items) {
      const stock = await this.repo.getStock(item.productId);
      if (stock) {
        stock.reserve(item.quantity);
        await this.repo.saveStock(stock);
        await this.repo.createReservation(cmd.orderId, item.productId, item.quantity, expiresAt);
        await this.repo.recordMovement({
          id: crypto.randomUUID(),
          productId: item.productId,
          type: 'reservation',
          quantity: item.quantity,
          referenceId: cmd.orderId,
          reason: `Reserva para orden ${cmd.orderId}`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    await this.outbox.publish('inventory.stock.reserved.v1', {
      orderId: cmd.orderId,
      items: cmd.items,
      expiresAt,
    });

    return { success: true };
  }
}

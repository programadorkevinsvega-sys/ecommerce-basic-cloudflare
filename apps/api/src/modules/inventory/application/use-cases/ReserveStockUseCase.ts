import { IInventoryOutboxRepository } from '../../domain/ports/IInventoryOutboxRepository.js';
import { IInventoryRepository } from '../../domain/ports/IInventoryRepository.js';

export interface ReserveStockCommand {
  orderId: string;
  items: Array<{ productId: string; quantity: number }>;
  ttlMinutes?: number;
}

export class ReserveStockUseCase {
  public constructor(private readonly repo: IInventoryRepository, private readonly outbox: IInventoryOutboxRepository) {}

  public async execute(cmd: ReserveStockCommand): Promise<{ success: boolean; error?: string }> {
    if (!cmd.orderId || !cmd.items.length || cmd.items.some((item) => !Number.isSafeInteger(item.quantity) || item.quantity < 1)) {
      return { success: false, error: 'Reserva de inventario inválida' };
    }
    const expiresAt = new Date(Date.now() + Math.min(Math.max(cmd.ttlMinutes ?? 30, 1), 60) * 60 * 1000).toISOString();
    const reserved: Array<{ productId: string; quantity: number }> = [];
    try {
      for (const item of cmd.items) {
        if (!await this.repo.tryReserveStock(item.productId, item.quantity)) {
          await this.rollback(cmd.orderId, reserved);
          return { success: false, error: 'Inventario insuficiente' };
        }
        reserved.push(item);
        await this.repo.createReservation(cmd.orderId, item.productId, item.quantity, expiresAt);
        await this.repo.recordMovement({
          id: crypto.randomUUID(), productId: item.productId, type: 'reservation', quantity: item.quantity,
          referenceId: cmd.orderId, reason: 'Reserva de inventario', createdAt: new Date().toISOString(),
        });
      }
      await this.outbox.publish('inventory.stock.reserved.v1', { orderId: cmd.orderId, items: cmd.items, expiresAt });
      return { success: true };
    } catch {
      await this.rollback(cmd.orderId, reserved);
      return { success: false, error: 'No fue posible completar la reserva' };
    }
  }

  private async rollback(orderId: string, reserved: Array<{ productId: string; quantity: number }>): Promise<void> {
    for (const item of reserved) await this.repo.releaseStockQuantity(item.productId, item.quantity);
    await this.repo.releaseReservation(orderId);
  }
}

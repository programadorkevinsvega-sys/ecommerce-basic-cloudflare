import { IInventoryRepository } from '../../domain/ports/IInventoryRepository.js';

export interface ConsumeStockCommand {
  orderId: string;
  items: Array<{ productId: string; quantity: number }>;
}

export class ConsumeStockUseCase {
  public constructor(private readonly repo: IInventoryRepository) {}

  public async execute(cmd: ConsumeStockCommand): Promise<void> {
    if (!cmd.orderId || !cmd.items.length) throw new Error('La orden requiere identificador y productos para consumir inventario');
    const totals = new Map<string, number>();
    for (const item of cmd.items) {
      if (!item.productId || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
        throw new Error('Los productos y cantidades de inventario no son válidos');
      }
      const total = (totals.get(item.productId) ?? 0) + item.quantity;
      if (!Number.isSafeInteger(total)) throw new Error('La cantidad agregada excede el límite permitido');
      totals.set(item.productId, total);
    }
    await this.repo.consumeOrder(cmd.orderId, [...totals].map(([productId, quantity]) => ({ productId, quantity })));
  }
}

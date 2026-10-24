import { InventoryModuleContainer } from './module.config.js';
import { InventoryStock } from './domain/entities/InventoryStock.js';
import { ReserveStockCommand } from './application/use-cases/ReserveStockUseCase.js';
import { ReleaseStockCommand } from './application/use-cases/ReleaseStockUseCase.js';
import { AdjustStockCommand } from './application/use-cases/AdjustStockUseCase.js';
import { ConsumeStockCommand } from './application/use-cases/ConsumeStockUseCase.js';
import { AdminInventoryPage, AdminInventoryQuery } from './domain/ports/AdminInventoryPage.js';

export class InventoryPublicApi {
  private readonly container: InventoryModuleContainer;

  public constructor(container: InventoryModuleContainer) {
    this.container = container;
  }

  public async getStock(productId: string): Promise<InventoryStock> {
    return this.container.getProductStockUseCase.execute(productId);
  }

  public hasStock(productId: string): Promise<boolean> { return this.container.getProductStockUseCase.exists(productId); }

  public async reserveStock(cmd: ReserveStockCommand): Promise<{ success: boolean; error?: string }> {
    return this.container.reserveStockUseCase.execute(cmd);
  }

  public async releaseStock(cmd: ReleaseStockCommand): Promise<void> {
    return this.container.releaseStockUseCase.execute(cmd);
  }

  public async adjustStock(cmd: AdjustStockCommand): Promise<InventoryStock> {
    return this.container.adjustStockUseCase.execute(cmd);
  }

  public async listStocks(): Promise<InventoryStock[]> {
    return this.container.listStockUseCase.execute();
  }

  public listAdminInventory(query: AdminInventoryQuery): Promise<AdminInventoryPage> {
    return this.container.listAdminInventoryUseCase.execute(query);
  }

  public async consumeStock(cmd: ConsumeStockCommand): Promise<void> {
    return this.container.consumeStockUseCase.execute(cmd);
  }

  public async hasActiveReservation(orderId: string, items: Array<{ productId: string; quantity: number }>): Promise<boolean> {
    return this.container.checkActiveReservationUseCase.execute(orderId, items);
  }
}

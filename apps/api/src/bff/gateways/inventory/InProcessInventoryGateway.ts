import { InventoryGateway, InventoryStockDto } from './InventoryGateway.js';
import { InventoryPublicApi } from '../../../modules/inventory/module.public-api.js';

export class InProcessInventoryGateway implements InventoryGateway {
  private readonly publicApi: InventoryPublicApi;

  public constructor(publicApi: InventoryPublicApi) {
    this.publicApi = publicApi;
  }

  public async getStock(productId: string): Promise<InventoryStockDto> {
    const stock = await this.publicApi.getStock(productId);
    return stock.toJSON();
  }

  public async reserveStock(orderId: string, items: Array<{ productId: string; quantity: number }>, ttlMinutes?: number): Promise<{ success: boolean; error?: string }> {
    return this.publicApi.reserveStock({ orderId, items, ttlMinutes });
  }

  public async releaseStock(orderId: string, items: Array<{ productId: string; quantity: number }>): Promise<void> {
    return this.publicApi.releaseStock({ orderId, items });
  }

  public async consumeStock(orderId: string, items: Array<{ productId: string; quantity: number }>): Promise<void> {
    return this.publicApi.consumeStock({ orderId, items });
  }

  public async adjustStock(productId: string, quantity: number, reason: string): Promise<InventoryStockDto> {
    const stock = await this.publicApi.adjustStock({ productId, quantity, reason });
    return stock.toJSON();
  }

  public async listStocks(): Promise<InventoryStockDto[]> {
    const list = await this.publicApi.listStocks();
    return list.map((s) => s.toJSON());
  }
}

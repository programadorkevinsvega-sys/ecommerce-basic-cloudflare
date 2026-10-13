import { InventoryGateway } from '../../gateways/inventory/InventoryGateway.js';

export async function hasReservedStock(inventory: InventoryGateway, order: { id: string; lines?: Array<{ productId: string; quantity: number }> }): Promise<boolean> {
  if (!order.lines?.length) return false;
  try { return await inventory.hasActiveReservation(order.id, order.lines.map(({ productId, quantity }) => ({ productId, quantity }))); }
  catch { return false; }
}

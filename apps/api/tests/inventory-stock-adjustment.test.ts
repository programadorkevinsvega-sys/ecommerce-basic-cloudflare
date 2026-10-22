import { describe, expect, it } from 'vitest';
import { InventoryStock } from '../src/modules/inventory/domain/entities/InventoryStock.js';

describe('InventoryStock absolute quantity adjustment', () => {
  it('sets total stock and preserves already reserved units', () => {
    const stock = new InventoryStock({
      productId: 'product-1', quantity: 0, reservedQuantity: 2, updatedAt: new Date().toISOString(),
    });

    stock.adjust(20);

    expect(stock).toMatchObject({ quantity: 20, reservedQuantity: 2, availableQuantity: 18 });
  });

  it('rejects a target lower than reservations', () => {
    const stock = new InventoryStock({
      productId: 'product-1', quantity: 20, reservedQuantity: 2, updatedAt: new Date().toISOString(),
    });

    expect(() => stock.adjust(1)).toThrow('no puede ser menor que las unidades reservadas');
    expect(stock).toMatchObject({ quantity: 20, reservedQuantity: 2 });
  });

  it('rejects non-integers, negative values and quantities above the operational limit', () => {
    const stock = new InventoryStock({
      productId: 'product-1', quantity: 20, reservedQuantity: 0, updatedAt: new Date().toISOString(),
    });

    expect(() => stock.adjust(-1)).toThrow('entero entre 0 y 100.000');
    expect(() => stock.adjust(1.5)).toThrow('entero entre 0 y 100.000');
    expect(() => stock.adjust(100001)).toThrow('entero entre 0 y 100.000');
  });
});

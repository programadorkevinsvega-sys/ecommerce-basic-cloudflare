import { describe, expect, it } from 'vitest';
import { WishlistItem } from '../src/modules/wishlist/domain/entities/WishlistItem.js';
import { IWishlistRepository, WishlistPage } from '../src/modules/wishlist/domain/ports/IWishlistRepository.js';
import { AddWishlistItemUseCase } from '../src/modules/wishlist/application/use-cases/AddWishlistItemUseCase.js';
import { ListWishlistItemsUseCase } from '../src/modules/wishlist/application/use-cases/ListWishlistItemsUseCase.js';
import { RemoveWishlistItemUseCase } from '../src/modules/wishlist/application/use-cases/RemoveWishlistItemUseCase.js';

function makeRepository(): IWishlistRepository {
  const items = new Map<string, WishlistItem>();
  return {
    async add(customerId, productId) {
      const key = customerId + ':' + productId;
      const existing = items.get(key);
      if (existing) return { item: existing, created: false };
      const item = new WishlistItem({ id: crypto.randomUUID(), customerId, productId, createdAt: new Date().toISOString() });
      items.set(key, item);
      return { item, created: true };
    },
    async listByCustomer(customerId, page, pageSize): Promise<WishlistPage> {
      const values = [...items.values()].filter((item) => item.customerId === customerId);
      return { items: values.slice((page - 1) * pageSize, page * pageSize), total: values.length };
    },
    async remove(customerId, productId) { return items.delete(customerId + ':' + productId); },
  };
}

describe('Wishlist use cases', () => {
  it('adds idempotently for the same customer and product', async () => {
    const useCase = new AddWishlistItemUseCase(makeRepository());
    const command = { customerId: 'customer-a', productId: 'product-1', traceId: 'trace-1' };
    await expect(useCase.execute(command)).resolves.toMatchObject({ created: true, item: { customerId: 'customer-a', productId: 'product-1' } });
    await expect(useCase.execute(command)).resolves.toMatchObject({ created: false, item: { productId: 'product-1' } });
  });

  it('isolates customers and validates pagination', async () => {
    const repo = makeRepository();
    const add = new AddWishlistItemUseCase(repo);
    await add.execute({ customerId: 'customer-a', productId: 'product-a', traceId: 'trace-a' });
    await add.execute({ customerId: 'customer-b', productId: 'product-b', traceId: 'trace-b' });
    const list = new ListWishlistItemsUseCase(repo);
    await expect(list.execute('customer-a', 1, 20)).resolves.toMatchObject({ total: 1, items: [{ customerId: 'customer-a' }] });
    await expect(list.execute('customer-a', 0, 20)).rejects.toThrow('Página inválida');
    await expect(list.execute('customer-a', 1, 51)).rejects.toThrow('Tamaño de página inválido');
  });

  it('does not remove another customer’s item', async () => {
    const repo = makeRepository();
    await new AddWishlistItemUseCase(repo).execute({ customerId: 'customer-a', productId: 'product-1', traceId: 'trace-a' });
    const remove = new RemoveWishlistItemUseCase(repo);
    await expect(remove.execute({ customerId: 'customer-b', productId: 'product-1', traceId: 'trace-b' })).resolves.toBe(false);
    await expect(new ListWishlistItemsUseCase(repo).execute('customer-a', 1, 20)).resolves.toMatchObject({ total: 1 });
    await expect(remove.execute({ customerId: 'customer-a', productId: 'product-1', traceId: 'trace-a' })).resolves.toBe(true);
  });
});
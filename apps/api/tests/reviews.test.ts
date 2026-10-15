import { describe, expect, it } from 'vitest';
import { SubmitProductReviewUseCase } from '../src/modules/reviews/application/use-cases/SubmitProductReviewUseCase.js';
import { IProductReviewRepository } from '../src/modules/reviews/domain/ports/IProductReviewRepository.js';

function repository(reviewed = false): IProductReviewRepository {
  return {
    async list() { throw new Error('not used'); },
    async summaries() { return []; },
    async listForAdmin() { return { items: [], total: 0 }; },
    async findById() { return null; },
    async create(input) { return { ...input, id: 'review-id', status: 'approved', source: 'verified', createdAt: '2026-10-14T00:00:00Z', updatedAt: '2026-10-14T00:00:00Z' }; },
    async createManual(input) { return { ...input, customerId: 'manual:review-id', id: 'review-id', source: 'manual', createdAt: '2026-10-14T00:00:00Z', updatedAt: '2026-10-14T00:00:00Z' }; },
    async hasCustomerReviewed(_productId, customerId) { return reviewed && customerId === 'buyer-a'; },
    async moderate() { return null; },
    async edit() { return null; },
    async delete() { return false; },
  };
}

describe('Product review eligibility', () => {
  it('accepts a review only when the signed-in customer owns a delivered paid purchase', async () => {
    const useCase = new SubmitProductReviewUseCase(repository(), { async hasDeliveredProductPurchase(customerId, productId) { return customerId === 'buyer-a' && productId === 'product-1'; } });
    await expect(useCase.execute({ productId: 'product-1', customerId: 'buyer-a', rating: 5, comment: 'Muy buen producto y llegó a tiempo.' })).resolves.toMatchObject({ customerId: 'buyer-a', rating: 5 });
  });

  it('rejects another customer even when they know the product id', async () => {
    const useCase = new SubmitProductReviewUseCase(repository(), { async hasDeliveredProductPurchase(customerId) { return customerId === 'buyer-a'; } });
    await expect(useCase.execute({ productId: 'product-1', customerId: 'buyer-b', rating: 5, comment: 'Muy buen producto y llegó a tiempo.' })).rejects.toThrow('Solo pueden opinar');
  });

  it('rejects duplicate reviews and invalid ratings/comments', async () => {
    const useCase = new SubmitProductReviewUseCase(repository(true), { async hasDeliveredProductPurchase() { return true; } });
    await expect(useCase.execute({ productId: 'product-1', customerId: 'buyer-a', rating: 4, comment: 'Mi opinión sobre este producto.' })).rejects.toThrow('Ya enviaste');
    await expect(useCase.execute({ productId: 'product-1', customerId: 'buyer-b', rating: 6, comment: 'Mi opinión sobre este producto.' })).rejects.toThrow('puntuación');
    await expect(useCase.execute({ productId: 'product-1', customerId: 'buyer-b', rating: 4, comment: 'Corto' })).rejects.toThrow('comentario');
  });
});

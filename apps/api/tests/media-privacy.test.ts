import { describe, expect, it } from 'vitest';
import { MediaAsset } from '../src/modules/media/domain/entities/MediaAsset.js';
import { ResolveMediaUrlUseCase } from '../src/modules/media/application/use-cases/ResolveMediaUrlUseCase.js';

describe('private media URL resolution', () => {
  it('does not expose storage metadata for a private asset', async () => {
    const asset = new MediaAsset({
      id: 'private-asset', storageKey: 'private/admin/admin-1/secret', originalFileName: 'secret.webp',
      mimeType: 'image/webp', fileSizeBytes: 123, altText: 'Secret', isPrivate: true,
      uploadedByAdminId: 'admin-1', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const useCase = new ResolveMediaUrlUseCase({ findById: async () => asset } as never);

    expect((await useCase.execute(asset.id)).isFail()).toBe(true);
  });
});

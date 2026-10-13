import { describe, expect, it, vi } from 'vitest';
import { CollectOrphanedMediaUseCase } from '../src/modules/media/application/use-cases/CollectOrphanedMediaUseCase.js';

describe('safe media orphan collection', () => {
  it('deletes only unreferenced public media older than seven days and preserves cursors', async () => {
    const now = new Date('2026-10-13T12:00:00.000Z');
    const deleteObject = vi.fn(async () => undefined);
    const referenced = vi.fn(async (key: string) => key === 'media/used.webp');
    const storage = {
      listPublicMedia: vi.fn(async () => ({
        objects: [
          { key: 'media/orphan.webp', uploadedAt: '2026-10-01T00:00:00.000Z' },
          { key: 'media/used.webp', uploadedAt: '2026-10-01T00:00:00.000Z' },
          { key: 'media/new.webp', uploadedAt: '2026-10-12T00:00:00.000Z' },
          { key: 'private/admin/secret', uploadedAt: '2026-10-01T00:00:00.000Z' },
        ], cursor: 'next-page',
      })),
      delete: deleteObject,
    };
    const repo = { isStorageKeyReferenced: referenced };
    const result = await new CollectOrphanedMediaUseCase(storage as never, repo as never).execute(undefined, now);

    expect(deleteObject).toHaveBeenCalledExactlyOnceWith('media/orphan.webp');
    expect(result).toEqual({ deleted: 1, cursor: 'next-page' });
  });

  it('does not delete anything when R2 list fails', async () => {
    const storage = { listPublicMedia: vi.fn().mockRejectedValue(new Error('R2 offline')), delete: vi.fn() };
    await expect(new CollectOrphanedMediaUseCase(storage as never, {} as never).execute()).rejects.toThrow('R2 offline');
    expect(storage.delete).not.toHaveBeenCalled();
  });
});

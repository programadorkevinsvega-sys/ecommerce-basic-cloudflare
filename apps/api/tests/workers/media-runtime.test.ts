import { beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { createMediaModule } from '../../src/modules/media/module.config.js';

describe('Media D1 and R2 integration', () => {
  beforeAll(async () => {
    for (const migration of env.TEST_MIGRATIONS) {
      for (const statement of migration.sql.split(';')) {
        if (statement.replace(/--[^\n]*/g, '').trim()) await env.DB.prepare(statement).run();
      }
    }
  });

  it('validates upload metadata and resolves the saved D1 reference from the R2 binding', async () => {
    const media = createMediaModule(env);
    const bytes = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg=='), (char) => char.charCodeAt(0));
    const invalid = await media.uploadMediaUseCase.execute({
      originalFileName: 'not-an-image.png', data: new TextEncoder().encode('not an image'),
      altText: 'invalid', uploadedByAdminId: 'integration-test',
    });
    expect(invalid.isFail()).toBe(true);

    const uploaded = await media.uploadMediaUseCase.execute({
      originalFileName: 'banner.png', data: bytes, altText: 'Banner de prueba', uploadedByAdminId: 'integration-test',
    });
    expect(uploaded.isOk()).toBe(true);
    if (uploaded.isFail()) throw uploaded.error;

    try {
      const served = await media.getMediaAssetUseCase.execute(uploaded.value.id);
      expect(served.isOk()).toBe(true);
      if (served.isFail()) throw served.error;
      expect(served.value.mimeType).toBe('image/png');
      expect(served.value.sizeBytes).toBe(bytes.length);
      expect(new Uint8Array(await new Response(served.value.stream).arrayBuffer())).toEqual(bytes);
      const row = await env.DB.prepare('SELECT width, height FROM media_assets WHERE id = ?').bind(uploaded.value.id).first<{ width: number; height: number }>();
      expect(row).toEqual({ width: 1, height: 1 });
    } finally {
      await env.MEDIA_BUCKET.delete(uploaded.value.storageKey);
      await env.DB.prepare('DELETE FROM media_assets WHERE id = ?').bind(uploaded.value.id).run();
    }
  });
});

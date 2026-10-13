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
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
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

    const served = await media.getMediaAssetUseCase.execute(uploaded.value.id);
    expect(served.isOk()).toBe(true);
    if (served.isFail()) throw served.error;
    expect(served.value.mimeType).toBe('image/png');
    expect(served.value.sizeBytes).toBe(bytes.length);
    expect(new Uint8Array(await new Response(served.value.stream).arrayBuffer())).toEqual(bytes);
    await env.MEDIA_BUCKET.delete(uploaded.value.storageKey);
  });
});

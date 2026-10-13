import { beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { createMediaModule } from '../../src/modules/media/module.config.js';
import { ImageValidator } from '../../src/modules/media/domain/services/ImageValidator.js';

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

    const damagedPixels = corruptPngDeflate(bytes);
    expect(ImageValidator.validateMagicBytes(damagedPixels).isValid).toBe(true);
    const decodeRejected = await media.uploadMediaUseCase.execute({
      originalFileName: 'corrupt.png', data: damagedPixels, altText: 'corrupt', uploadedByAdminId: 'integration-test',
    });
    expect(decodeRejected.isFail()).toBe(true);

    const uploaded = await media.uploadMediaUseCase.execute({
      originalFileName: 'banner.png', data: bytes, altText: 'Banner de prueba', uploadedByAdminId: 'integration-test',
    });
    expect(uploaded.isOk()).toBe(true);
    if (uploaded.isFail()) throw uploaded.error;

    try {
      const served = await media.getMediaAssetUseCase.execute(uploaded.value.id);
      expect(served.isOk()).toBe(true);
      if (served.isFail()) throw served.error;
      expect(served.value.mimeType).toBe('image/webp');
      expect(served.value.sizeBytes).toBeGreaterThan(0);
      const processed = new Uint8Array(await new Response(served.value.stream).arrayBuffer());
      expect(new TextDecoder().decode(processed.slice(0, 4))).toBe('RIFF');
      const row = await env.DB.prepare('SELECT width, height FROM media_assets WHERE id = ?').bind(uploaded.value.id).first<{ width: number; height: number }>();
      expect(row).toEqual({ width: 1, height: 1 });
    } finally {
      await env.MEDIA_BUCKET.delete(uploaded.value.storageKey);
      await env.DB.prepare('DELETE FROM media_assets WHERE id = ?').bind(uploaded.value.id).run();
    }
  });
});

function corruptPngDeflate(bytes: Uint8Array): Uint8Array {
  const copy = bytes.slice();
  const idat = findBytes(copy, [73, 68, 65, 84]);
  const chunk = idat - 4;
  const length = new DataView(copy.buffer).getUint32(chunk);
  copy[idat + 4] = (copy[idat + 4] || 0) ^ 0xff;
  const crc = pngCrc(copy.subarray(idat, idat + 4 + length));
  new DataView(copy.buffer).setUint32(idat + 4 + length, crc);
  return copy;
}

function findBytes(haystack: Uint8Array, needle: number[]): number {
  for (let offset = 0; offset <= haystack.length - needle.length; offset++) {
    if (needle.every((byte, index) => haystack[offset + index] === byte)) return offset;
  }
  throw new Error('PNG IDAT not found');
}

function pngCrc(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

import { beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { MediaController } from '../../src/bff/controllers/media/MediaController.js';
import { IdentityGateway } from '../../src/bff/gateways/identity/IdentityGateway.js';
import { InProcessMediaGateway } from '../../src/bff/gateways/media/InProcessMediaGateway.js';
import { MediaPublicApi } from '../../src/modules/media/module.public-api.js';
import { createMediaModule } from '../../src/modules/media/module.config.js';

describe('public media edge cache', () => {
  beforeAll(async () => {
    for (const migration of env.TEST_MIGRATIONS) {
      for (const statement of migration.sql.replace(/--[^\n]*/g, '').split(';')) {
        if (statement.trim()) await env.DB.prepare(statement).run();
      }
    }
  });

  it('caches immutable public media and never caches private media', async () => {
    const media = createMediaModule(env);
    const gateway = new InProcessMediaGateway(new MediaPublicApi(media));
    const identity: IdentityGateway = {
      registerCustomer: async () => ({ id: '', email: '', fullName: '' }),
      loginCustomer: async () => ({ rawToken: '', expiresAt: '' }),
      loginAdmin: async () => ({ rawToken: '', expiresAt: '', mfaEnabled: true }),
      beginAdminMfaEnrollment: async () => ({ secret: '', otpauthUri: '' }),
      confirmAdminMfaEnrollment: async () => undefined,
      validateSession: async () => { throw new Error('not used'); },
      logout: async () => undefined,
      getCustomerProfile: async () => ({ id: '', email: '', fullName: '', isActive: true, createdAt: '' }),
      updateCustomerProfile: async () => ({ fullName: '' }),
      changeCustomerPassword: async () => ({ rawToken: '', expiresAt: '' }),
      listCustomerSessions: async () => [],
      revokeCustomerSession: async () => true,
    };
    const app = MediaController.createRoutes(gateway, identity);
    const bytes = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg=='), (char) => char.charCodeAt(0));
    const publicUpload = await media.uploadMediaUseCase.execute({
      originalFileName: 'public.png', data: bytes, altText: 'Public', uploadedByAdminId: 'cache-test',
    });
    if (publicUpload.isFail()) throw publicUpload.error;
    const publicId = publicUpload.value.id;
    const publicKey = `media/${publicId}`;
    const publicUrl = `https://store.example/media/${publicId}`;
    const publicCacheKey = new Request(publicUrl);

    try {
      const firstResponse = await app.fetch(new Request(`https://store.example/${publicId}`));
      expect(firstResponse.status).toBe(200);
      expect(firstResponse.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
      expect(await caches.default.match(publicCacheKey)).toBeDefined();

      await env.MEDIA_BUCKET.delete(publicKey);
      const cachedResponse = await app.fetch(new Request(`https://store.example/${publicId}`));
      expect(cachedResponse.status).toBe(200);
      expect((await cachedResponse.arrayBuffer()).byteLength).toBe(publicUpload.value.fileSizeBytes);

      const privateUpload = await media.uploadMediaUseCase.execute({
        originalFileName: 'private.png', data: bytes, altText: 'Private', isPrivate: true, uploadedByAdminId: 'cache-test',
      });
      if (privateUpload.isFail()) throw privateUpload.error;
      expect(privateUpload.value.publicUrl).toBeNull();
      expect('storageKey' in privateUpload.value).toBe(false);
      const privateUrl = `https://store.example/media/${privateUpload.value.id}`;
      const privateCacheKey = new Request(privateUrl);
      try {
        expect((await app.fetch(new Request(`https://store.example/${privateUpload.value.id}`))).status).toBe(404);
        expect(await caches.default.match(privateCacheKey)).toBeUndefined();
      } finally {
        await caches.default.delete(privateCacheKey);
        await env.MEDIA_BUCKET.delete(`private/admin/cache-test/${privateUpload.value.id}`);
        await env.DB.prepare('DELETE FROM media_assets WHERE id = ?').bind(privateUpload.value.id).run();
      }
    } finally {
      await caches.default.delete(publicCacheKey);
      await env.MEDIA_BUCKET.delete(publicKey);
      await env.DB.prepare('DELETE FROM media_assets WHERE id = ?').bind(publicId).run();
    }
  });
});

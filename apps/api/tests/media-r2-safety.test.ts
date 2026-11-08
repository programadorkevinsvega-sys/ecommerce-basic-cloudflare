import { describe, expect, it, vi } from 'vitest';
import { MediaController } from '../src/bff/controllers/media/MediaController.js';
import { IdentityGateway, AuthenticatedSession } from '../src/bff/gateways/identity/IdentityGateway.js';
import { MediaGateway } from '../src/bff/gateways/media/MediaGateway.js';
import { GetMediaAssetUseCase } from '../src/modules/media/application/use-cases/GetMediaAssetUseCase.js';
import { MediaAsset } from '../src/modules/media/domain/entities/MediaAsset.js';
import { UploadMediaUseCase } from '../src/modules/media/application/use-cases/UploadMediaUseCase.js';

describe('R2 media access safety', () => {
  it('requires an authenticated admin with MFA and media:create for uploads', async () => {
    const uploadMedia = vi.fn(async () => ({
      id: 'media-id',
      storageKey: 'private/admin/should-not-be-returned',
      originalFileName: 'private.png',
      mimeType: 'image/webp',
      fileSizeBytes: 20,
      altText: 'Private document',
      publicUrl: null,
    }));
    const gateway = createMediaGateway(uploadMedia);
    const session: AuthenticatedSession = {
      actorId: 'admin-id',
      actorType: 'admin',
      permissions: ['media:create'],
      mfaEnabled: true,
    };
    const app = MediaController.createRoutes(gateway, createIdentityGateway(session));
    const form = new FormData();
    form.append('file', new File([new Uint8Array(12)], 'private.png', { type: 'image/png' }));
    form.append('altText', 'Private document');
    form.append('isPrivate', 'true');

    const response = await app.fetch(new Request('https://store.example/upload', {
      method: 'POST',
      headers: { cookie: '__Host-admin-session=test-session' },
      body: form,
    }));
    const body = await response.json() as { data: Record<string, unknown> };

    expect(response.status).toBe(201);
    expect(body.data.publicUrl).toBeNull();
    expect(body.data).not.toHaveProperty('storageKey');
    expect(uploadMedia).toHaveBeenCalledOnce();
  });

  it('rejects private assets before reading the R2 object', async () => {
    const asset = new MediaAsset({
      id: 'private-id',
      storageKey: 'private/admin/private-id',
      originalFileName: 'private.webp',
      mimeType: 'image/webp',
      fileSizeBytes: 20,
      altText: 'Private file',
      isPrivate: true,
      uploadedByAdminId: 'admin-id',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const get = vi.fn(async () => null);
    const useCase = new GetMediaAssetUseCase(
      { get } as never,
      { findById: async () => asset } as never,
    );

    const result = await useCase.execute(asset.id);

    expect(result.isFail()).toBe(true);
    expect(get).not.toHaveBeenCalled();
  });

  it('rejects oversized uploads before writing to R2', async () => {
    const put = vi.fn(async () => 0);
    const useCase = new UploadMediaUseCase(
      { put } as never,
      {} as never,
      { decodeAndSanitize: async (data) => ({ data, mimeType: 'image/webp', width: 1, height: 1 }) },
    );

    const result = await useCase.execute({
      originalFileName: 'large.png',
      data: new Uint8Array(10 * 1024 * 1024 + 1),
      altText: 'Large file',
      uploadedByAdminId: 'admin-id',
    });

    expect(result.isFail()).toBe(true);
    expect(put).not.toHaveBeenCalled();
  });

  it('deletes the uploaded object if saving its D1 metadata fails', async () => {
    const deleted = vi.fn(async () => undefined);
    const bytes = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg=='), (char) => char.charCodeAt(0));
    const useCase = new UploadMediaUseCase(
      {
        put: async () => bytes.length,
        head: async () => ({ sizeBytes: bytes.length }),
        delete: deleted,
      } as never,
      { save: async () => { throw new Error('D1 unavailable'); } } as never,
      { decodeAndSanitize: async (data) => ({ data, mimeType: 'image/webp', width: 1, height: 1 }) },
    );

    await expect(useCase.execute({
      originalFileName: 'one.png', data: bytes, altText: 'One pixel', uploadedByAdminId: 'admin-id',
    })).rejects.toThrow('No se pudo registrar el archivo');
    expect(deleted).toHaveBeenCalledOnce();
  });
});

function createMediaGateway(
  uploadMedia: MediaGateway['uploadMedia'],
): MediaGateway {
  return {
    uploadMedia,
    getMedia: async () => ({ stream: new ReadableStream(), mimeType: 'image/webp', sizeBytes: 0, altText: '' }),
    resolveMedia: async () => ({ id: 'media-id', publicUrl: '/media/media-id', altText: '' }),
  };
}

function createIdentityGateway(session: AuthenticatedSession): IdentityGateway {
  return {
    registerCustomer: async () => ({ id: '', email: '', fullName: '' }),
    loginCustomer: async () => ({ rawToken: '', expiresAt: '' }),
    loginAdmin: async () => ({ rawToken: '', expiresAt: '', mfaEnabled: true }),
    beginAdminMfaEnrollment: async () => ({ secret: '', otpauthUri: '' }),
    confirmAdminMfaEnrollment: async () => undefined,
    validateSession: async () => session,
    logout: async () => undefined,
    getCustomerProfile: async () => ({ id: '', email: '', fullName: '', isActive: true, createdAt: '' }),
    updateCustomerProfile: async () => ({ fullName: '' }),
    changeCustomerPassword: async () => ({ rawToken: '', expiresAt: '' }),
    listCustomerSessions: async () => [],
    revokeCustomerSession: async () => true,
  };
}

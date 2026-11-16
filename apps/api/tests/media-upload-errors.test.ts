import { describe, expect, it, vi } from 'vitest';
import { MediaController } from '../src/bff/controllers/media/MediaController.js';

function createUploadRequest(): FormData {
  const body = new FormData();
  body.append('file', new Blob([new Uint8Array(24)], { type: 'image/png' }), 'image.png');
  body.append('altText', 'Producto de prueba');
  body.append('isPrivate', 'false');
  return body;
}

function createController(uploadMedia: ReturnType<typeof vi.fn>) {
  const media = { uploadMedia };
  const identity = {
    validateSession: vi.fn().mockResolvedValue({
      actorId: 'admin-1', actorType: 'admin', mfaEnabled: true, permissions: ['media:create'],
    }),
  };
  return MediaController.createRoutes(media as never, identity as never);
}

describe('media upload error responses', () => {
  it('returns a traceable storage failure and logs a safe diagnostic category', async () => {
    const uploadMedia = vi.fn().mockRejectedValue(new Error('No se pudo verificar el objeto almacenado'));
    const app = createController(uploadMedia);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const response = await app.request('/upload', {
      method: 'POST',
      headers: { Cookie: '__Host-admin-session=admin-session' },
      body: createUploadRequest(),
    });
    const body = await response.json() as { error: string; errorCode: string; traceId: string };
    const logOutput = log.mock.calls.map(([entry]) => String(entry)).join('\n');

    expect(response.status).toBe(503);
    expect(body.errorCode).toBe('MEDIA_STORAGE_VERIFICATION_FAILED');
    expect(body.error).toContain('No se pudo confirmar la imagen');
    expect(logOutput).toContain('"failure_reason":"media_storage_verification_failed"');
    expect(logOutput).not.toContain('No se pudo verificar el objeto almacenado');
    log.mockRestore();
  });

  it('keeps expected invalid-image errors as actionable 400 responses', async () => {
    const uploadMedia = vi.fn().mockRejectedValue(new Error('Imagen truncada, malformada o con dimensiones inválidas'));
    const app = createController(uploadMedia);

    const response = await app.request('/upload', {
      method: 'POST',
      headers: { Cookie: '__Host-admin-session=admin-session' },
      body: createUploadRequest(),
    });
    const body = await response.json() as { error: string; errorCode: string };

    expect(response.status).toBe(400);
    expect(body.errorCode).toBe('MEDIA_UPLOAD_INVALID');
    expect(body.error).toContain('Imagen truncada');
  });
});

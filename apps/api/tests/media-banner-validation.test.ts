import { describe, expect, it, vi } from 'vitest';
import { ImageValidator } from '../src/modules/media/domain/services/ImageValidator.js';
import { isSafeImageUrl, isSafeStoreLink } from '../src/modules/storefront/domain/services/ValidateStorefrontUrl.js';
import { Banner } from '../src/modules/storefront/domain/entities/Banner.js';
import { renderStorefrontManagementSection } from '../src/bff/views/admin/renderStorefrontManagementSection.js';
import { renderStorefrontActionsScript } from '../src/bff/views/admin/renderStorefrontActionsScript.js';
import { renderStorefrontBanners } from '../src/bff/views/renderStorefrontBanners.js';
import { UploadMediaUseCase } from '../src/modules/media/application/use-cases/UploadMediaUseCase.js';
import { IMediaStoragePort } from '../src/modules/media/domain/ports/IMediaStoragePort.js';
import { IMediaAssetRepository } from '../src/modules/media/domain/ports/IMediaAssetRepository.js';
import { MediaController } from '../src/bff/controllers/media/MediaController.js';

describe('media and banner input validation', () => {
  const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg=='), (char) => char.charCodeAt(0));

  it('validates image container structure and dimensions instead of trusting a signature alone', () => {
    expect(ImageValidator.validateMagicBytes(png)).toMatchObject({ isValid: true, detectedMimeType: 'image/png', width: 1, height: 1 });
    expect(ImageValidator.validateMagicBytes(png.slice(0, 24)).isValid).toBe(false);
    expect(ImageValidator.validateMagicBytes(new TextEncoder().encode('<svg></svg>')).isValid).toBe(false);
  });

  it('extracts bounded dimensions from JPEG, WebP and AVIF headers', () => {
    expect(ImageValidator.validateMagicBytes(jpegHeader())).toMatchObject({ isValid: true, detectedMimeType: 'image/jpeg', width: 1, height: 1 });
    expect(ImageValidator.validateMagicBytes(webpHeader())).toMatchObject({ isValid: true, detectedMimeType: 'image/webp', width: 1, height: 1 });
    expect(ImageValidator.validateMagicBytes(avifHeader(1, 1))).toMatchObject({ isValid: true, detectedMimeType: 'image/avif', width: 1, height: 1 });
    expect(ImageValidator.validateMagicBytes(avifHeader(10_000, 5_000)).isValid).toBe(false);
    expect(ImageValidator.validateMagicBytes(jpegHeader().slice(0, 8)).isValid).toBe(false);
  });

  it('allows HTTPS image references and internal destinations but rejects active schemes and external redirects', () => {
    expect(isSafeImageUrl('https://images.example.test/banner.webp')).toBe(true);
    expect(isSafeImageUrl('https://127.0.0.1/banner.webp')).toBe(false);
    expect(isSafeImageUrl('https://2130706433/banner.webp')).toBe(false);
    expect(isSafeImageUrl('https://100.64.0.1/banner.webp')).toBe(false);
    expect(isSafeImageUrl('https://192.168.1.5/banner.webp')).toBe(false);
    expect(isSafeImageUrl('https://localhost./banner.webp')).toBe(false);
    expect(isSafeImageUrl('https://[::1]/banner.webp')).toBe(false);
    expect(isSafeImageUrl('https://[fc00::1]/banner.webp')).toBe(false);
    expect(isSafeImageUrl('https://[fe80::1]/banner.webp')).toBe(false);
    expect(isSafeImageUrl('https://[2001:db8::1]/banner.webp')).toBe(false);
    expect(isSafeImageUrl('https://[2606:4700:4700::1111]/banner.webp')).toBe(true);
    expect(isSafeImageUrl('https://images.example.test:8443/banner.webp')).toBe(false);
    expect(isSafeImageUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeImageUrl('//attacker.test/image')).toBe(false);
    expect(isSafeStoreLink('/productos/ofertas')).toBe(true);
    expect(isSafeStoreLink('https://attacker.test')).toBe(false);
    expect(isSafeStoreLink('//attacker.test')).toBe(false);
  });

  it('rejects unsupported filename extensions before writing to R2', async () => {
    const storage = { put: async () => 12, head: async () => ({ sizeBytes: 12 }), get: async () => null, delete: async () => undefined, listPublicMedia: async () => ({ objects: [] }) } as IMediaStoragePort;
    const repository = { save: async () => undefined } as unknown as IMediaAssetRepository;
    const useCase = new UploadMediaUseCase(storage, repository, passThroughImageProcessor);
    const result = await useCase.execute({ originalFileName: 'image.svg', data: png, altText: 'Image', uploadedByAdminId: 'admin' });

    expect(result.isFail()).toBe(true);
    expect(result.error.message).toContain('extensión');
  });

  it('verifies the remote object size before saving D1 metadata and persists dimensions', async () => {
    const head = vi.fn(async () => ({ sizeBytes: png.length }));
    const put = vi.fn(async () => png.length);
    const saved: Array<{ width?: number; height?: number }> = [];
    const storage = { put, head, get: async () => null, delete: vi.fn(async () => undefined) } as unknown as IMediaStoragePort;
    const repository = { save: async (asset: { toPrimitives(): { width?: number; height?: number } }) => { saved.push(asset.toPrimitives()); } } as unknown as IMediaAssetRepository;
    const result = await new UploadMediaUseCase(storage, repository, passThroughImageProcessor).execute({
      originalFileName: 'one-pixel.png', data: png, altText: 'Imagen', uploadedByAdminId: 'admin',
    });

    expect(result.isOk()).toBe(true);
    expect(head).toHaveBeenCalledOnce();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ width: 1, height: 1 });
  });

  it('removes the newly uploaded object and does not save metadata when remote size verification fails', async () => {
    const deletion = vi.fn(async () => undefined);
    const save = vi.fn(async () => undefined);
    const storage = { put: vi.fn(async () => png.length), head: vi.fn(async () => null), get: async () => null, delete: deletion } as unknown as IMediaStoragePort;
    const result = await new UploadMediaUseCase(storage, { save } as unknown as IMediaAssetRepository, passThroughImageProcessor).execute({
      originalFileName: 'one-pixel.png', data: png, altText: 'Imagen', uploadedByAdminId: 'admin',
    });

    expect(result.isFail()).toBe(true);
    expect(deletion).toHaveBeenCalledOnce();
    expect(save).not.toHaveBeenCalled();
  });

  it('bounds streamed media upload requests when Content-Length is absent', async () => {
    const identity = { validateSession: async () => ({ actorId: 'admin', actorType: 'admin', mfaEnabled: true, permissions: ['media:create'] }) };
    const app = MediaController.createRoutes({} as any, identity as any);
    const body = new ReadableStream<Uint8Array>({ start(controller) {
      controller.enqueue(new Uint8Array(12 * 1024 * 1024));
      controller.close();
    } });
    const request = new Request('http://localhost/upload', { method: 'POST', headers: { cookie: '__Host-admin-session=test' }, body, duplex: 'half' } as RequestInit);

    const response = await app.fetch(request);
    expect(response.status).toBe(413);
  });

  it('rejects invalid placement, unsafe image URLs and inverted validity periods', () => {
    const now = new Date().toISOString();
    const base = { id: 'banner', title: 'Aviso', imageUrl: '/media/image', linkUrl: '/productos', altText: 'Aviso', placement: 'home' as const, isActive: true, createdAt: now, updatedAt: now, sortOrder: 0 };
    expect(() => new Banner({ ...base, imageUrl: 'javascript:alert(1)' })).toThrow();
    expect(() => new Banner({ ...base, startsAt: '2026-11-01T00:00:00.000Z', endsAt: '2026-10-01T00:00:00.000Z' })).toThrow();
    expect(() => new Banner({ ...base, placement: 'unknown' as any })).toThrow();
  });

  it('renders functioning filter controls, accessible public carousel navigation, and no auto-rotation', () => {
    const adminMarkup = renderStorefrontManagementSection([], []);
    expect(adminMarkup.match(/class="form-grid banner-filters"/g)).toHaveLength(2);
    expect(adminMarkup).toContain('Filtrar tipo');
    expect(renderStorefrontActionsScript()).toContain("card.querySelector('.banner-filters')");

    const publicMarkup = renderStorefrontBanners([
      { id: 'one', title: 'Uno', imageUrl: '/media/one', linkUrl: '/productos', altText: 'Uno' },
      { id: 'two', title: 'Dos', imageUrl: '/media/two', linkUrl: '/productos', altText: 'Dos' },
    ], 'Banners destacados');
    expect(publicMarkup).toContain('aria-roledescription="carrusel"');
    expect(publicMarkup).toContain('aria-label="1 de 2"');
    expect(publicMarkup).toContain('aria-controls="storefrontBannerCarousel"');
    expect(publicMarkup).toContain('prefers-reduced-motion: reduce');
    expect(publicMarkup).not.toContain('setInterval');
  });
});

const passThroughImageProcessor = { decodeAndSanitize: async (data: Uint8Array) => ({ data, mimeType: 'image/webp' as const, width: 1, height: 1 }) };

function jpegHeader(): Uint8Array {
  return new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0, 11, 8, 0, 1, 0, 1, 1, 1, 0x11, 0,
    0xff, 0xda, 0, 8, 1, 1, 0, 0, 0x3f, 0, 0, 0xff, 0xd9]);
}

function webpHeader(): Uint8Array {
  const bytes = new Uint8Array(30);
  bytes.set(new TextEncoder().encode('RIFF'), 0); bytes.set(new TextEncoder().encode('WEBP'), 8);
  new DataView(bytes.buffer).setUint32(4, 22, true);
  bytes.set(new TextEncoder().encode('VP8X'), 12); new DataView(bytes.buffer).setUint32(16, 10, true);
  return bytes;
}

function avifHeader(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(36);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 16); bytes.set(new TextEncoder().encode('ftypavif'), 4);
  view.setUint32(16, 20); bytes.set(new TextEncoder().encode('ispe'), 20);
  view.setUint32(28, width); view.setUint32(32, height);
  return bytes;
}

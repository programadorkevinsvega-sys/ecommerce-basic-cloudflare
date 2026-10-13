import { describe, expect, it } from 'vitest';
import { ImageValidator } from '../src/modules/media/domain/services/ImageValidator.js';
import { isSafeImageUrl, isSafeStoreLink } from '../src/modules/storefront/domain/services/ValidateStorefrontUrl.js';
import { Banner } from '../src/modules/storefront/domain/entities/Banner.js';
import { renderStorefrontManagementSection } from '../src/bff/views/admin/renderStorefrontManagementSection.js';
import { renderStorefrontActionsScript } from '../src/bff/views/admin/renderStorefrontActionsScript.js';
import { renderStorefrontBanners } from '../src/bff/views/renderStorefrontBanners.js';
import { UploadMediaUseCase } from '../src/modules/media/application/use-cases/UploadMediaUseCase.js';
import { IMediaStoragePort } from '../src/modules/media/domain/ports/IMediaStoragePort.js';
import { IMediaAssetRepository } from '../src/modules/media/domain/ports/IMediaAssetRepository.js';

describe('media and banner input validation', () => {
  it('detects allowed image signatures from bytes and rejects declared-type-only files', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(ImageValidator.validateMagicBytes(png)).toMatchObject({ isValid: true, detectedMimeType: 'image/png' });
    expect(ImageValidator.validateMagicBytes(new TextEncoder().encode('<svg></svg>')).isValid).toBe(false);
  });

  it('allows HTTPS image references and internal destinations but rejects active schemes and external redirects', () => {
    expect(isSafeImageUrl('https://images.example.test/banner.webp')).toBe(true);
    expect(isSafeImageUrl('https://127.0.0.1/banner.webp')).toBe(false);
    expect(isSafeImageUrl('https://192.168.1.5/banner.webp')).toBe(false);
    expect(isSafeImageUrl('https://localhost/banner.webp')).toBe(false);
    expect(isSafeImageUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeImageUrl('//attacker.test/image')).toBe(false);
    expect(isSafeStoreLink('/productos/ofertas')).toBe(true);
    expect(isSafeStoreLink('https://attacker.test')).toBe(false);
    expect(isSafeStoreLink('//attacker.test')).toBe(false);
  });

  it('rejects unsupported filename extensions before writing to R2', async () => {
    const storage = { put: async () => 12, get: async () => null, delete: async () => undefined } as IMediaStoragePort;
    const repository = { save: async () => undefined } as unknown as IMediaAssetRepository;
    const useCase = new UploadMediaUseCase(storage, repository);
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const result = await useCase.execute({ originalFileName: 'image.svg', data: pngHeader, altText: 'Image', uploadedByAdminId: 'admin' });

    expect(result.isFail()).toBe(true);
    expect(result.error.message).toContain('extensión');
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

import { describe, expect, it } from 'vitest';
import { ImageValidator } from '../src/modules/media/domain/services/ImageValidator.js';
import { isSafeImageUrl, isSafeStoreLink } from '../src/modules/storefront/domain/services/ValidateStorefrontUrl.js';
import { Banner } from '../src/modules/storefront/domain/entities/Banner.js';

describe('media and banner input validation', () => {
  it('detects allowed image signatures from bytes and rejects declared-type-only files', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(ImageValidator.validateMagicBytes(png)).toMatchObject({ isValid: true, detectedMimeType: 'image/png' });
    expect(ImageValidator.validateMagicBytes(new TextEncoder().encode('<svg></svg>')).isValid).toBe(false);
  });

  it('allows HTTPS image references and internal destinations but rejects active schemes and external redirects', () => {
    expect(isSafeImageUrl('https://images.example.test/banner.webp')).toBe(true);
    expect(isSafeImageUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeImageUrl('//attacker.test/image')).toBe(false);
    expect(isSafeStoreLink('/productos/ofertas')).toBe(true);
    expect(isSafeStoreLink('https://attacker.test')).toBe(false);
    expect(isSafeStoreLink('//attacker.test')).toBe(false);
  });

  it('rejects invalid placement, unsafe image URLs and inverted validity periods', () => {
    const now = new Date().toISOString();
    const base = { id: 'banner', title: 'Aviso', imageUrl: '/media/image', linkUrl: '/productos', altText: 'Aviso', placement: 'home' as const, isActive: true, createdAt: now, updatedAt: now, sortOrder: 0 };
    expect(() => new Banner({ ...base, imageUrl: 'javascript:alert(1)' })).toThrow();
    expect(() => new Banner({ ...base, startsAt: '2026-11-01T00:00:00.000Z', endsAt: '2026-10-01T00:00:00.000Z' })).toThrow();
    expect(() => new Banner({ ...base, placement: 'unknown' as any })).toThrow();
  });
});

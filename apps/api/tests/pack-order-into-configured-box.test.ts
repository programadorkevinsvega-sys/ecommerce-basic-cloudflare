import { describe, expect, it } from 'vitest';
import { CarrierPackageProfile } from '../src/modules/shipping/domain/entities/CarrierPackageProfile.js';
import { packOrderIntoConfiguredBox } from '../src/modules/shipping/domain/services/PackOrderIntoConfiguredBox.js';

const box = (overrides: Partial<CarrierPackageProfile> = {}): CarrierPackageProfile => ({
  id: 'iphone-box',
  name: 'Caja iPhone',
  innerWidthCm: 19,
  innerLengthCm: 11,
  innerHeightCm: 5,
  outerWidthCm: 21,
  outerLengthCm: 13,
  outerHeightCm: 7,
  tareWeightGrams: 100,
  maxWeightGrams: 1000,
  singleUnitProductIds: ['iphone-16-pro'],
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const phone = {
  productId: 'iphone-16-pro',
  widthCm: 19,
  lengthCm: 11,
  heightCm: 5,
  weightGrams: 700,
  quantity: 1,
};

describe('packOrderIntoConfiguredBox', () => {
  it('uses the product-associated box for one unit and includes its tare', () => {
    expect(packOrderIntoConfiguredBox([phone], [box()])).toEqual({
      profileId: 'iphone-box',
      widthCm: 21,
      lengthCm: 13,
      heightCm: 7,
      weightGrams: 800,
      weightKg: 1,
    });
  });

  it('does not use a product-associated box that cannot contain the packed product', () => {
    expect(packOrderIntoConfiguredBox([phone], [box({ innerWidthCm: 18 })])).toBeNull();
  });

  it('keeps individual package dimensions for one unit when no box is associated', () => {
    expect(packOrderIntoConfiguredBox([phone], [box({ singleUnitProductIds: ['another-product'] })])).toEqual({
      profileId: null,
      widthCm: 19,
      lengthCm: 11,
      heightCm: 5,
      weightGrams: 700,
      weightKg: 1,
    });
  });

  it('does not use a single-unit product box for a multi-unit order', () => {
    expect(packOrderIntoConfiguredBox([{ ...phone, quantity: 2 }], [box()])).toBeNull();
  });
});

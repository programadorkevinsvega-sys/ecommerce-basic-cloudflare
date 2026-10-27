import { describe, expect, it, vi } from 'vitest';
import { ProductLandingConfig } from '../src/modules/catalog/domain/entities/ProductLandingConfig.js';
import { SaveProductLandingConfigUseCase } from '../src/modules/catalog/application/use-cases/SaveProductLandingConfigUseCase.js';
import type { IProductRepository } from '../src/modules/catalog/domain/ports/IProductRepository.js';
import type { IProductLandingConfigRepository } from '../src/modules/catalog/domain/ports/IProductLandingConfigRepository.js';
import type { Product } from '../src/modules/catalog/domain/entities/Product.js';

const sample = {
  productId: 'product-1',
  enabled: true,
  templateKey: 'conversion' as const,
  eyebrow: 'Nuevo',
  headline: 'Mejora tu setup',
  subtitle: 'Descripción de la campaña',
  ctaLabel: 'Comprar ahora',
  benefits: [{ title: 'Precisión', description: 'Control preciso para jugar.' }],
  faqs: [{ question: '¿Tiene garantía?', answer: 'Consulta las condiciones de garantía.' }],
  sections: ['benefits', 'faq'] as const,
};

describe('ProductLandingConfig', () => {
  it('normaliza textos y devuelve copias defensivas de sus listas', () => {
    const config = new ProductLandingConfig({ ...sample, sections: [...sample.sections], createdAt: '2026-01-01', updatedAt: '2026-01-01' });
    const primitives = config.toPrimitives();
    expect(primitives.headline).toBe('Mejora tu setup');
    primitives.benefits.push({ title: 'Otro', description: 'Texto' });
    expect(config.toPrimitives().benefits).toHaveLength(1);
  });

  it('rechaza plantillas y cantidades de contenido no permitidas', () => {
    expect(() => new ProductLandingConfig({
      ...sample, templateKey: 'custom' as 'conversion', benefits: Array.from({ length: 7 }, () => ({ title: 'B', description: 'D' })),
      sections: [...sample.sections], createdAt: 'now', updatedAt: 'now',
    })).toThrow();
  });

  it('crea configuración estándar desactivada por defecto', () => {
    const config = ProductLandingConfig.createDefault('product-2');
    expect(config.toPrimitives()).toMatchObject({ enabled: false, templateKey: 'standard', ctaLabel: 'Comprar ahora' });
  });
});

describe('SaveProductLandingConfigUseCase', () => {
  it('persiste la configuración solo para un producto existente', async () => {
    const product = { id: sample.productId } as Product;
    const products = { findById: vi.fn().mockResolvedValue(product) } as unknown as IProductRepository;
    const configs = {
      findByProductId: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
    } as unknown as IProductLandingConfigRepository;
    const result = await new SaveProductLandingConfigUseCase(products, configs).execute({
      ...sample, sections: [...sample.sections],
    });
    expect(result.isOk()).toBe(true);
    expect(configs.save).toHaveBeenCalledOnce();
    expect(result.value.toPrimitives()).toMatchObject({ productId: sample.productId, enabled: true });
  });

  it('no persiste una configuración para un producto inexistente', async () => {
    const products = { findById: vi.fn().mockResolvedValue(null) } as unknown as IProductRepository;
    const configs = { findByProductId: vi.fn(), save: vi.fn() } as unknown as IProductLandingConfigRepository;
    const result = await new SaveProductLandingConfigUseCase(products, configs).execute({
      ...sample, sections: [...sample.sections],
    });
    expect(result.isFail()).toBe(true);
    expect(configs.save).not.toHaveBeenCalled();
  });
});

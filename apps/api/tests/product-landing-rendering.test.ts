import { describe, expect, it } from 'vitest';
import { renderProductLandingHero } from '../src/bff/views/renderProductLandingHero.js';
import { renderProductLandingBenefits } from '../src/bff/views/renderProductLandingBenefits.js';
import { renderProductLandingFaq } from '../src/bff/views/renderProductLandingFaq.js';
import { renderProductDetail } from '../src/bff/views/renderProductDetail.js';
import type { ProductLandingConfigDto } from '../src/bff/gateways/catalog/ProductLandingGateway.js';
import type { CatalogProductDto } from '../src/bff/gateways/catalog/CatalogGateway.js';

const product: CatalogProductDto = {
  id: 'product-1', name: 'Mouse gamer', slug: 'mouse-gamer', description: 'Mouse para jugar',
  priceInCents: 12990000, sku: 'MOU-01', stockQuantity: 8, status: 'published', condition: 'new',
  specifications: { DPI: '16000' }, brand: 'Tech', tags: [], noindex: false,
  salePolicy: { allowsCashOnDelivery: true, shippingScope: 'national', localCoverageZones: [], saleMode: 'cash' },
  categoryIds: [], mediaIds: ['media-1'], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
};

const landing: ProductLandingConfigDto = {
  productId: product.id, enabled: true, templateKey: 'conversion',
  eyebrow: 'NUEVO', headline: 'Potencia tu setup', subtitle: 'Precisión para cada partida.',
  ctaLabel: 'Comprar ahora', seoTitle: 'Mouse gamer preciso', seoDescription: 'Mouse gamer con precisión.',
  benefits: [{ title: 'DPI alto', description: 'Ajusta la precisión.' }],
  faqs: [{ question: '¿Tiene garantía?', answer: 'Sí, según las condiciones.' }],
  sections: ['benefits', 'specifications', 'reviews', 'faq', 'related'],
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('SSR de landing de producto', () => {
  it('escapa el contenido del hero y mantiene el CTA apuntando al carrito existente', () => {
    const hero = renderProductLandingHero({ ...landing, headline: '<script>alert(1)</script>' }, product);
    expect(hero).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(hero).not.toContain('<script>alert(1)</script>');
    expect(hero).toContain('href="#detail-purchase"');
    expect(hero).toContain('/media/media-1');
  });

  it('respeta la plantilla y las secciones de beneficios y FAQ', () => {
    expect(renderProductLandingHero({ ...landing, templateKey: 'standard' }, product)).toBe('');
    expect(renderProductLandingBenefits({ ...landing, templateKey: 'standard' })).toContain('Beneficios destacados');
    expect(renderProductLandingBenefits(landing)).toBe('');
    expect(renderProductLandingFaq(landing)).toContain('¿Tiene garantía?');
    expect(renderProductLandingFaq({ ...landing, sections: ['benefits'] })).toBe('');
  });

  it('mantiene el CTA de compra y permite ocultar secciones no seleccionadas', () => {
    const html = renderProductDetail(product, undefined, undefined, {
      introHtml: '<section class="test-hero"><h1>Landing</h1></section>',
      sections: [],
    });
    expect(html).toContain('id="detail-purchase"');
    expect(html).toContain('id="btn-add-cart"');
    expect(html).not.toContain('<h1>Mouse gamer</h1>');
    expect(html).not.toContain('detail-specifications');
    expect(html).not.toContain('detail-review-summary');
  });

  it('conserva las especificaciones y reseñas en la ficha estándar por defecto', () => {
    const html = renderProductDetail(product);
    expect(html).toContain('detail-specifications');
    expect(html).toContain('detail-review-summary');
    expect(html).toContain('<h1>Mouse gamer</h1>');
  });
});

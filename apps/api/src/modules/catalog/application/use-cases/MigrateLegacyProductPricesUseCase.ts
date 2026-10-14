import { IProductRepository } from '../../domain/ports/IProductRepository.js';

export interface LegacyPriceMigrationPreview {
  legacyProductCount: number;
  taxRateBasisPoints: number;
  fingerprint: string;
  products: Array<{ id: string; name: string; previousPriceCents: number; finalPriceCents: number }>;
}

export class MigrateLegacyProductPricesUseCase {
  constructor(private readonly repository: IProductRepository) {}

  public async preview(taxRateBasisPoints: number): Promise<LegacyPriceMigrationPreview> {
    const products = await this.loadLegacyProducts();
    return {
      legacyProductCount: products.length,
      taxRateBasisPoints,
      fingerprint: await this.fingerprint(products),
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        previousPriceCents: product.priceInCents,
        finalPriceCents: product.priceInCents + Math.round(product.priceInCents * taxRateBasisPoints / 10000),
      })),
    };
  }

  public async execute(taxRateBasisPoints: number, expectedCount: number, expectedFingerprint: string): Promise<number> {
    if (!Number.isSafeInteger(expectedCount) || expectedCount < 0) throw new Error('Conteo de confirmación inválido');
    const products = await this.loadLegacyProducts();
    if (products.length !== expectedCount || await this.fingerprint(products) !== expectedFingerprint) throw new Error('El catálogo cambió desde la vista previa; vuelve a previsualizar');
    for (const product of products) {
      const previousPrice = product.priceInCents;
      const finalPrice = previousPrice + Math.round(previousPrice * taxRateBasisPoints / 10000);
      product.updateDetails({ priceInCents: finalPrice, pricingVersion: 2, legacyPriceBeforeTaxCents: previousPrice });
      await this.repository.save(product);
    }
    return products.length;
  }

  private async loadLegacyProducts() {
    const products = [];
    for (let offset = 0; ; offset += 100) {
      const page = await this.repository.list(100, offset);
      products.push(...page.filter((product) => product.pricingVersion === 1));
      if (page.length < 100) return products;
    }
  }

  private async fingerprint(products: Array<{ id: string; priceInCents: number; updatedAt: string }>): Promise<string> {
    const source = products.map((product) => `${product.id}:${product.priceInCents}:${product.updatedAt}`).join('|');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
}

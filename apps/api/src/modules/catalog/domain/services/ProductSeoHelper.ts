export class ProductSeoHelper {
  public static readonly TITLE_MAX_RECOMMENDED = 70;
  public static readonly DESC_MAX_RECOMMENDED = 160;

  public static resolveTitle(seoTitle?: string, fallbackName?: string): string {
    if (seoTitle && seoTitle.trim().length > 0) {
      return seoTitle.trim();
    }
    return (fallbackName || 'Producto').trim();
  }

  public static resolveDescription(seoDescription?: string, fallbackDescription?: string): string {
    if (seoDescription && seoDescription.trim().length > 0) {
      return seoDescription.trim();
    }
    const cleanDesc = (fallbackDescription || '')
      .replace(/<[^>]*>?/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
    return cleanDesc.substring(0, this.DESC_MAX_RECOMMENDED);
  }

  public static slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }

  public static generateJsonLd(product: {
    name: string;
    description: string;
    priceInCents: number;
    sku: string;
    brand?: string;
    stockQuantity: number;
    condition?: string;
    url: string;
    imageUrl?: string;
    ratingValue?: number;
    reviewCount?: number;
  }): string {
    const itemCondition = product.condition === 'used'
      ? 'https://schema.org/UsedCondition'
      : product.condition === 'refurbished'
      ? 'https://schema.org/RefurbishedCondition'
      : 'https://schema.org/NewCondition';

    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description.substring(0, 300),
      sku: product.sku,
      image: product.imageUrl || undefined,
      brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
      itemCondition,
      aggregateRating: product.ratingValue && product.reviewCount ? {
        '@type': 'AggregateRating',
        ratingValue: product.ratingValue.toFixed(1),
        reviewCount: product.reviewCount,
      } : undefined,
      offers: {
        '@type': 'Offer',
        price: (product.priceInCents / 100).toFixed(2),
        priceCurrency: 'COP',
        priceValidUntil: validUntil.toISOString().split('T')[0],
        availability: product.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: product.url,
      },
    };

    return JSON.stringify(schema).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  }
}

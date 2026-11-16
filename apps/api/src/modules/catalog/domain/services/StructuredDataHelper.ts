export class StructuredDataHelper {
  public static generateBreadcrumbList(items: Array<{ name: string; url: string }>): string {
    const itemListElement = items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    }));

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement,
    };

    return this.serializeJsonLd(schema);
  }

  public static generateWebSiteSchema(storeUrl: string, storeName: string): string {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: storeName,
      url: storeUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${storeUrl}/productos?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };

    return this.serializeJsonLd(schema);
  }

  public static generateOrganizationSchema(storeUrl: string, storeName: string, logoUrl?: string): string {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: storeName,
      url: storeUrl,
      logo: logoUrl || `${storeUrl}/media/logo.png`,
    };

    return this.serializeJsonLd(schema);
  }

  public static generateItemListSchema(items: Array<{ name: string; url: string; position: number }>): string {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: items.map((it) => ({
        '@type': 'ListItem',
        position: it.position,
        name: it.name,
        url: it.url,
      })),
    };

    return this.serializeJsonLd(schema);
  }

  public static serializeJsonLd(value: unknown): string {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) throw new Error('No se pudo serializar JSON-LD');
    return serialized.replace(/[&<>\u2028\u2029]/g, (char) => ({
      '&': '\\u0026', '<': '\\u003c', '>': '\\u003e', '\u2028': '\\u2028', '\u2029': '\\u2029',
    })[char] ?? char);
  }
}

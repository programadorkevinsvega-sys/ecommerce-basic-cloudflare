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

    return JSON.stringify(schema).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
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

    return JSON.stringify(schema).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  }

  public static generateOrganizationSchema(storeUrl: string, storeName: string, logoUrl?: string): string {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: storeName,
      url: storeUrl,
      logo: logoUrl || `${storeUrl}/media/logo.png`,
    };

    return JSON.stringify(schema).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
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

    return JSON.stringify(schema).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  }
}

import type { AppCompositionRoot } from '../../composition-root.js';

export class AdminMutationSnapshotProvider {
  constructor(private readonly gateways: AppCompositionRoot) {}

  public async read(path: string, body?: Record<string, unknown>, token?: string): Promise<unknown> {
    if (path.startsWith('/api/v1/admin/auth/mfa/') && token) {
      const session = await this.gateways.identityGateway.validateSession(token);
      return { mfaEnabled: session.mfaEnabled === true };
    }
    if (path === '/api/v1/settings') return this.gateways.settingsGateway.getSettings();
    const resource = path.match(/^\/api\/v1\/admin\/(products|categories|brands|attributes|banners|announcements|cms\/pages|cms\/menus|cms\/blog\/posts|cms\/blog\/authors|cms\/blog\/categories|shipping\/zones|promotions\/rules|promotions\/coupons|orders|invoices|reviews)\/([^/]+)(?:\/|$)/);
    if (resource) {
      const kind = resource[1];
      const rawId = resource[2];
      if (!kind || !rawId) return null;
      const id = decodeURIComponent(rawId);
      if (kind === 'reviews') {
        const review = await this.gateways.reviewsGateway.getById(id);
        return review ? { id: review.id, productId: review.productId, rating: review.rating, status: review.status } : null;
      }
      if (kind === 'products') return this.gateways.catalogGateway.getProductById(id);
      if (kind === 'categories') return (await this.gateways.catalogGateway.listCategories()).find((item) => item.id === id) ?? null;
      if (kind === 'brands') return (await this.gateways.catalogGateway.listBrands()).find((item) => item.id === id) ?? null;
      if (kind === 'attributes') return (await this.gateways.catalogGateway.listAttributes()).find((item) => item.id === id) ?? null;
      if (kind === 'banners') return (await this.gateways.storefrontGateway.listBanners()).find((item) => item.id === id) ?? null;
      if (kind === 'announcements') return (await this.gateways.storefrontGateway.listAnnouncements()).find((item) => item.id === id) ?? null;
      if (kind === 'cms/pages') return (await this.gateways.cmsGateway.listPages(500)).find((item) => item.id === id) ?? null;
      if (kind === 'cms/menus') {
        const menu = await this.gateways.cmsGateway.getMenuByCode(id);
        return { code: menu.code, title: menu.title, items: menu.items.map(menuItemSnapshot) };
      }
      if (kind === 'cms/blog/posts') return this.gateways.cmsGateway.getBlogPostById(id);
      if (kind === 'cms/blog/authors') return this.gateways.cmsGateway.getBlogAuthor(id);
      if (kind === 'cms/blog/categories') return this.gateways.cmsGateway.getBlogCategory(id);
      if (kind === 'shipping/zones') return this.gateways.shippingGateway.getZone(id);
      if (kind === 'promotions/rules') return (await this.gateways.promotionsGateway.listPromotionRules()).find((item) => item.id === id) ?? null;
      if (kind === 'promotions/coupons') return (await this.gateways.promotionsGateway.listCoupons()).find((item) => item.id === id) ?? null;
      if (kind === 'orders') return this.gateways.ordersGateway.getOrder(id);
      if (kind === 'invoices') return this.gateways.invoicingGateway.getInvoice({ id });
    }
    if (path === '/api/v1/admin/inventory/adjust' && typeof body?.productId === 'string') {
      return this.gateways.inventoryGateway.getStock(body.productId);
    }
    if (path === '/api/v1/admin/inventory/sync') return this.gateways.inventoryGateway.listStocks();
    if (path === '/api/v1/admin/payments/cod/collect' && typeof body?.orderId === 'string') {
      const collections = await this.gateways.paymentsGateway.listCodCollections(500);
      return collections.filter((item) => item.orderId === body.orderId);
    }
    if (path === '/api/v1/realtime/notifications/read' && Array.isArray(body?.ids)) {
      const notifications = await this.gateways.realtimeGateway.getNotifications({ channel: 'admin', limit: 500 });
      const ids = new Set(body.ids.filter((id): id is string => typeof id === 'string'));
      return notifications.filter((item) => ids.has(item.id));
    }
    if (path === '/api/v1/admin/seo/redirects' && typeof body?.fromPath === 'string') {
      return this.gateways.seoGateway.resolveRedirect(body.fromPath);
    }
    return null;
  }

  public createdResourcePath(path: string, id: string): string | null {
    const collections = new Set([
      '/api/v1/admin/products', '/api/v1/admin/categories', '/api/v1/admin/brands',
      '/api/v1/admin/attributes', '/api/v1/admin/storefront/banners',
      '/api/v1/admin/storefront/announcements', '/api/v1/admin/cms/pages',
      '/api/v1/admin/cms/blog/posts',
      '/api/v1/admin/cms/blog/authors', '/api/v1/admin/cms/blog/categories',
      '/api/v1/admin/shipping/zones', '/api/v1/admin/promotions/rules',
      '/api/v1/admin/promotions/coupons',
      '/api/v1/admin/reviews',
    ]);
    return collections.has(path) ? `${path}/${encodeURIComponent(id)}` : null;
  }
}

interface SnapshotMenuItem { id: string; title: string; type?: string; url: string; children?: SnapshotMenuItem[]; }

function menuItemSnapshot(item: SnapshotMenuItem): Record<string, unknown> {
  return {
    id: item.id, title: item.title, type: item.type || 'link', url: item.url,
    children: (item.children || []).map(menuItemSnapshot),
  };
}

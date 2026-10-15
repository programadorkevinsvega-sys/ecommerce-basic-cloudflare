export function renderAdminSidebar(adminLabel: string): string {
  return `<aside class="admin-sidebar" aria-label="Panel de administración">
    <a class="admin-brand" href="/admin" aria-label="Vega Store, resumen">
      <span class="admin-brand-mark" aria-hidden="true">V</span><span><strong>Vega Store</strong><small>Panel de control</small></span>
    </a>
    <nav class="admin-nav" aria-label="Principal">
      <section class="admin-nav-group"><h2>Operación</h2><ul>
        ${navItem('summary', 'Resumen', 'switchTab(\'summary\')', true)}
        ${navItem('orders', 'Pedidos', "switchTab('orders'); loadAdminOrders();", false, 'orders-pending-count', 'por atender')}
        ${navItem('inventory', 'Inventario', "switchTab('inventory'); loadAdminInventory();", false, 'inventory-alert-count', 'con stock bajo o agotados')}
        ${navItem('shipping', 'Envíos y cobertura', "switchTab('shipping', this); showAdminShippingPage('zones')")}
        ${navItem('shipping', 'Municipios DANE', "switchTab('shipping', this); showAdminShippingPage('locations')", false, undefined, undefined, true)}
        ${navItem('shipping', 'Transportadoras', "switchTab('shipping', this); showAdminShippingPage('carriers')", false, undefined, undefined, true)}
        ${navItem('shipping', 'Empaques', "switchTab('shipping', this); showAdminShippingPage('packages')", false, undefined, undefined, true)}
        ${navItem('shipping', 'Seguimiento de pedidos', "switchTab('shipping', this); showAdminShippingPage('tracking')", false, undefined, undefined, true)}
      </ul></section>
      <section class="admin-nav-group"><h2>Pagos y facturas</h2><ul>
        ${navItem('payments', 'Recaudos contra entrega', "switchTab('payments', this); showAdminPaymentPage('collections'); loadAdminPayments()", false, undefined, undefined, true)}
        ${navItem('payments', 'Conciliar', "switchTab('payments', this); showAdminPaymentPage('conciliation'); loadAdminPayments()", false, undefined, undefined, true)}
        ${navItem('payments', 'Transacciones recientes', "switchTab('payments', this); showAdminPaymentPage('transactions'); loadAdminPayments()", false, undefined, undefined, true)}
        ${navItem('invoices', 'Facturación', "switchTab('invoices', this); loadAdminInvoices()", false, undefined, undefined, true)}
      </ul></section>
      <section class="admin-nav-group"><h2>Catálogo</h2><ul>
        ${navItem('products', 'Productos', "switchTab('products')")}
        ${navItem('taxonomies', 'Colecciones', "switchTab('taxonomies', this); showCatalogPage('collections', this)", false, undefined, undefined, true)}
        ${navItem('taxonomies', 'Categorías', "switchTab('taxonomies', this); showCatalogPage('categories', this)", false, undefined, undefined, true)}
        ${navItem('taxonomies', 'Marcas', "switchTab('taxonomies', this); showCatalogPage('brands', this)", false, undefined, undefined, true)}
        ${navItem('taxonomies', 'Proveedores', "switchTab('taxonomies', this); showCatalogPage('providers', this)", false, undefined, undefined, true)}
        ${navItem('taxonomies', 'Atributos', "switchTab('taxonomies', this); showCatalogPage('attributes', this)", false, undefined, undefined, true)}
        ${navItem('taxonomies', 'Variantes', "switchTab('taxonomies', this); showCatalogPage('variants', this)", false, undefined, undefined, true)}
        ${navItem('reviews', 'Reseñas y valoraciones', "switchTab('reviews', this); loadAdminReviews(1)", false, undefined, undefined, true)}
      </ul></section>
      <section class="admin-nav-group"><h2>Marketing</h2><ul>
        ${navItem('storefront', 'Banners Hero Promocionales', "switchTab('storefront', this); showMarketingPage('promo-banners')", false, undefined, undefined, true)}
        ${navItem('storefront', 'Banners Hero Informativos', "switchTab('storefront', this); showMarketingPage('info-banners')", false, undefined, undefined, true)}
        ${navItem('storefront', 'Anuncios & Barra Superior', "switchTab('storefront', this); showMarketingPage('announcements')", false, undefined, undefined, true)}
        ${navItem('promotions', 'Regla de Promoción', "switchTab('promotions', this); showMarketingPage('promotion-rule')", false, undefined, undefined, true)}
        ${navItem('promotions', 'Cupón de Descuento', "switchTab('promotions', this); showMarketingPage('discount-coupon')", false, undefined, undefined, true)}
      </ul></section>
      <section class="admin-nav-group"><h2>CMS</h2><ul>
        ${navItem('cms', 'Páginas CMS', "switchTab('cms')")}
        ${navItem('menus', 'Menús', "switchTab('menus', this); loadAdminMenus()", false, undefined, undefined, true)}
        ${navItem('blog', 'Blog', "switchTab('blog', this); blogInit()", false, undefined, undefined, true)}
      </ul></section>
      <section class="admin-nav-group"><h2>Sistema</h2><ul>
        ${navItem('audit', 'Auditoría', "switchTab('audit'); loadAdminAudit();")}
        ${navItem('settings', 'Configuración', "switchTab('settings')")}
      </ul></section>
    </nav>
    <div class="admin-sidebar-user"><span class="admin-avatar" aria-hidden="true">${escapeHtml(initials(adminLabel))}</span>
      <span class="admin-user-label"><strong>${escapeHtml(adminLabel)}</strong><small>Sesión de administrador</small></span>
      <button class="btn-logout" id="logoutBtn" type="button">Cerrar sesión</button>
    </div>
  </aside>`;
}

function navItem(id: string, label: string, action: string, current = false, countId?: string, countLabel?: string, nested = false): string {
  const count = countId ? `<span class="admin-nav-count"><strong id="${countId}">—</strong><small>${escapeHtml(countLabel || '')}</small></span>` : '';
  return `<li><button type="button" class="tab-btn admin-nav-link${current ? ' active' : ''}${nested ? ' admin-nav-link-nested' : ''}" data-tab="${id}" onclick="${action}"${current ? ' aria-current="page"' : ''}>${escapeHtml(label)}${count}</button></li>`;
}

function initials(label: string): string {
  const words = label.trim().split(/[\s@._-]+/).filter(Boolean);
  const first = words[0] || 'A';
  const second = words[1];
  return (second ? first.charAt(0) + second.charAt(0) : first.slice(0, 2)).toUpperCase();
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

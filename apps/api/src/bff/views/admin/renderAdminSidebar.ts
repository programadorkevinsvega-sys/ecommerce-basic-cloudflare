export function renderAdminSidebar(adminLabel: string): string {
  return `<aside class="admin-sidebar" aria-label="Panel de administración">
    <a class="admin-brand" href="/admin" aria-label="Vega Store, resumen">
      <span class="admin-brand-mark" aria-hidden="true">V</span><span><strong>Vega Store</strong><small>Panel de control</small></span>
    </a>
    <nav class="admin-nav" aria-label="Principal">
      <section class="admin-nav-group"><h2>Operación</h2><ul>
        ${navItem('summary', 'Resumen', 'summary', true)}
        ${navItem('orders', 'Pedidos', 'orders')}
        ${navItem('inventory', 'Inventario', 'inventory', false, 'inventory-alert-count', 'con stock bajo o agotados')}
        ${navItem('shipping', 'Envíos y cobertura', 'shipping', false, undefined, undefined, false, 'zones')}
        ${navItem('shipping', 'Municipios DANE', 'shipping', false, undefined, undefined, true, 'locations')}
        ${navItem('shipping', 'Transportadoras', 'shipping', false, undefined, undefined, true, 'carriers')}
        ${navItem('shipping', 'Empaques', 'shipping', false, undefined, undefined, true, 'packages')}
        ${navItem('shipping', 'Seguimiento de pedidos', 'shipping', false, undefined, undefined, true, 'tracking')}
        ${navItem('shipping', 'Imprimir guías', 'shipping', false, undefined, undefined, true, 'print-labels')}
      </ul></section>
      <section class="admin-nav-group"><h2>Pagos y facturas</h2><ul>
        ${navItem('payments', 'Recaudos contra entrega', 'payments', false, undefined, undefined, true, 'collections')}
        ${navItem('payments', 'Conciliar', 'payments', false, undefined, undefined, true, 'conciliation')}
        ${navItem('payments', 'Transacciones recientes', 'payments', false, undefined, undefined, true, 'transactions')}
        ${navItem('invoices', 'Facturación', 'invoices', false, undefined, undefined, true, 'all')}
        ${navItem('invoices', 'Facturación electrónica', 'invoices', false, undefined, undefined, true, 'electronic')}
      </ul></section>
      <section class="admin-nav-group"><h2>Catálogo</h2><ul>
        ${navItem('products', 'Productos', 'products')}
        ${navItem('taxonomies', 'Colecciones', 'catalog', false, undefined, undefined, true, 'collections')}
        ${navItem('taxonomies', 'Categorías', 'catalog', false, undefined, undefined, true, 'categories')}
        ${navItem('taxonomies', 'Marcas', 'catalog', false, undefined, undefined, true, 'brands')}
        ${navItem('taxonomies', 'Proveedores', 'catalog', false, undefined, undefined, true, 'providers')}
        ${navItem('taxonomies', 'Atributos', 'catalog', false, undefined, undefined, true, 'attributes')}
        ${navItem('taxonomies', 'Variantes', 'catalog', false, undefined, undefined, true, 'variants')}
        ${navItem('taxonomies', 'Etiquetas', 'catalog', false, undefined, undefined, true, 'tags')}
        ${navItem('reviews', 'Reseñas y valoraciones', 'reviews', false, undefined, undefined, true)}
      </ul></section>
      <section class="admin-nav-group"><h2>Marketing</h2><ul>
        ${navItem('storefront', 'Banners Hero Promocionales', 'marketing', false, undefined, undefined, true, 'promo-banners')}
        ${navItem('storefront', 'Banners Hero Informativos', 'marketing', false, undefined, undefined, true, 'info-banners')}
        ${navItem('storefront', 'Anuncios & Barra Superior', 'marketing', false, undefined, undefined, true, 'announcements')}
        ${navItem('promotions', 'Regla de Promoción', 'marketing', false, undefined, undefined, true, 'promotion-rule')}
        ${navItem('promotions', 'Cupón de Descuento', 'marketing', false, undefined, undefined, true, 'discount-coupon')}
        ${navItem('promotions', 'Envío gratis', 'marketing', false, undefined, undefined, true, 'free-shipping')}
      </ul></section>
      <section class="admin-nav-group"><h2>CMS</h2><ul>
        ${navItem('cms', 'Páginas CMS', 'cms')}
        ${navItem('menus', 'Menús', 'menus', false, undefined, undefined, true)}
        ${navItem('blog', 'Blog', 'blog', false, undefined, undefined, true)}
      </ul></section>
      <section class="admin-nav-group"><h2>Sistema</h2><ul>
        ${navItem('audit', 'Auditoría', 'audit')}
        ${navItem('settings', 'Configuración', 'settings')}
      </ul></section>
    </nav>
    <div class="admin-sidebar-user"><span class="admin-avatar" aria-hidden="true">${escapeHtml(initials(adminLabel))}</span>
      <span class="admin-user-label"><strong>${escapeHtml(adminLabel)}</strong><small>Sesión de administrador</small></span>
      <button class="btn-logout" id="logoutBtn" type="button">Cerrar sesión</button>
    </div>
  </aside>`;
}

function navItem(id: string, label: string, action: string, current = false, countId?: string, countLabel?: string, nested = false, page?: string): string {
  const count = countId ? `<span class="admin-nav-count"><strong id="${countId}">—</strong><small>${escapeHtml(countLabel || '')}</small></span>` : '';
  const pageAttr = page ? ` data-admin-nav-page="${escapeHtml(page)}"` : '';
  return `<li><button type="button" class="tab-btn admin-nav-link${current ? ' active' : ''}${nested ? ' admin-nav-link-nested' : ''}" data-tab="${id}" data-admin-nav="${escapeHtml(label)}" data-admin-nav-action="${action}"${pageAttr}${current ? ' aria-current="page"' : ''}>${escapeHtml(label)}${count}</button></li>`;
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

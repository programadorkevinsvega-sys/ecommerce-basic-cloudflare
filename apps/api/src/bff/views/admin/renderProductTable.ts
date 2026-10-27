import { CatalogProductDto } from '../../gateways/catalog/CatalogGateway.js';

export function renderProductTable(products: CatalogProductDto[]): string {
  const published = products.filter((p) => p.status === 'published').length;
  const drafts = products.filter((p) => p.status === 'draft').length;
  const lowStock = products.filter((p) => p.stockQuantity < 10).length;
  const rows = renderProductRows(products);

  const jsonScript = `<script>
    window.__catalogProducts = ${JSON.stringify(products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}))};
  </script>`;

  return `
    <section class="products-screen" aria-labelledby="products-title">
      <header class="products-heading"><div><span class="products-eyebrow">CATÁLOGO</span><h1 id="products-title">Productos</h1><p>Administra el catálogo, precios, existencias y publicación.</p></div><button class="products-primary-button" type="button" onclick="startCreateProduct()"><span aria-hidden="true">＋</span>Crear producto</button></header>
      <section class="products-kpis" aria-label="Resumen de productos"><article><span>Productos</span><strong id="products-total">${products.length}</strong></article><article><span>Publicados</span><strong id="products-published">${published}</strong></article><article><span>Borradores</span><strong id="products-drafts">${drafts}</strong></article><article><span>Stock bajo</span><strong id="products-low-stock">${lowStock}</strong></article></section>
      <details class="products-maintenance"><summary>Herramientas de mantenimiento de precios históricos</summary><p>Previsualiza antes de convertir. El cambio conserva el precio anterior en el catálogo y mantiene los totales actuales con la tasa de IVA configurada.</p><button type="button" class="products-secondary-button" onclick="previewLegacyPriceMigration()">Previsualizar conversión</button><div id="legacy-price-preview" aria-live="polite"></div></details>
      <section class="products-list-card" aria-label="Lista de productos">
        <div class="products-list-toolbar"><div><h2>Todos los productos</h2><p id="products-results-count">${products.length} productos</p></div><label class="products-search"><span class="sr-only">Buscar productos</span><input id="products-search" type="search" placeholder="Buscar por nombre, SKU o marca" autocomplete="off"></label></div>
        <div class="products-filter-tabs" role="group" aria-label="Filtrar productos por estado">${filterButton('all', 'Todos', products.length, true)}${filterButton('published', 'Publicados', published)}${filterButton('draft', 'Borradores', drafts)}${filterButton('archived', 'Archivados', products.filter((p) => p.status === 'archived').length)}</div>
        <div class="products-table-scroll"><table class="products-table"><thead><tr><th>Producto</th><th>SKU</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Contra entrega</th><th>Acciones</th></tr></thead><tbody id="products-table-body">${rows || '<tr><td colspan="7" class="products-empty">Aún no tienes productos. Usa “Crear producto” para agregar el primero.</td></tr>'}</tbody></table></div>
        <footer class="products-list-footer"><span id="products-visible-count">Mostrando ${products.length} productos</span><nav id="products-pagination" aria-label="Paginación de productos"></nav><span>Precios en COP</span></footer>
      </section>
    </section>
    ${jsonScript}
  `;
}

export function renderProductRows(products: CatalogProductDto[]): string {
  return products.map((p) => {
    const price = (p.priceInCents / 100).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
    const cod = p.salePolicy.allowsCashOnDelivery ? '✅ Sí' : '❌ No';
    const statusBadge = p.status === 'published'
      ? '<span class="badge badge-published">Publicado</span>'
      : p.status === 'draft'
      ? '<span class="badge badge-draft">Borrador</span>'
      : '<span class="badge badge-archived">Archivado</span>';

    const toggleAction = p.status === 'published'
      ? `<button class="btn-action btn-action-hide" onclick="setProductStatus('${p.id}', 'draft')">Ocultar</button>`
      : `<button class="btn-action btn-action-publish" onclick="setProductStatus('${p.id}', 'published')">Publicar</button>`;

    return `
      <tr class="products-row" data-search="${escapeHtml(`${p.name} ${p.sku} ${p.slug} ${p.brand || ''}`.toLocaleLowerCase())}" data-status="${escapeHtml(p.status)}">
        <td><div class="products-product-cell">${p.mediaIds?.[0] ? `<img src="/media/${escapeHtml(p.mediaIds[0])}" alt="" loading="lazy">` : '<span class="products-product-placeholder" aria-hidden="true">□</span>'}<span><strong>${escapeHtml(p.name)}</strong><small>/productos/${escapeHtml(p.slug)}</small></span></div>
        </td>
        <td><code>${escapeHtml(p.sku)}</code></td>
        <td class="products-price">${price}</td>
        <td><span class="products-stock${p.stockQuantity < 10 ? ' low' : ''}">${p.stockQuantity}</span></td>
        <td>${statusBadge}</td>
        <td>${cod}</td>
        <td class="products-actions">
          <a class="btn-action btn-action-view" href="/productos/${escapeHtml(p.slug)}" target="_blank" rel="noopener noreferrer">Ver</a>
          <button class="btn-action btn-action-landing" type="button" data-open-product-landing="${escapeHtml(p.id)}">Landing</button>
          <button class="btn-action btn-action-edit" onclick="editProduct('${p.id}')">Editar</button>
          ${toggleAction}
          <button class="btn-action btn-action-delete" onclick="deleteProduct('${p.id}')">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterButton(value: string, label: string, count: number, selected = false): string {
  return `<button type="button" class="products-filter-button${selected ? ' selected' : ''}" data-product-filter="${value}" aria-pressed="${selected}">${label}<span>${count}</span></button>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

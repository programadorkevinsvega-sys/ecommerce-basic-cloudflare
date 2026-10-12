import { CatalogProductDto } from '../../gateways/catalog/CatalogGateway.js';

export function renderProductTable(products: CatalogProductDto[]): string {
  const rows = products.map((p) => {
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
      <tr>
        <td style="padding: 0.75rem; border-bottom: 1px solid #334155; font-weight:600;">
          ${escapeHtml(p.name)}
          <div style="font-size:0.75rem; color:#94a3b8; font-family:monospace;">/productos/${escapeHtml(p.slug)}</div>
        </td>
        <td style="padding: 0.75rem; border-bottom: 1px solid #334155; font-family: monospace;">${escapeHtml(p.sku)}</td>
        <td style="padding: 0.75rem; border-bottom: 1px solid #334155;">${price}</td>
        <td style="padding: 0.75rem; border-bottom: 1px solid #334155;">${p.stockQuantity}</td>
        <td style="padding: 0.75rem; border-bottom: 1px solid #334155;">${statusBadge}</td>
        <td style="padding: 0.75rem; border-bottom: 1px solid #334155;">${cod}</td>
        <td style="padding: 0.75rem; border-bottom: 1px solid #334155; text-align:right; white-space:nowrap;">
          <a class="btn-action btn-action-view" href="/productos/${escapeHtml(p.slug)}" target="_blank">Ver</a>
          <button class="btn-action" style="background:#475569; color:#fff;" onclick="editProduct('${p.id}')">Editar</button>
          ${toggleAction}
          <button class="btn-action btn-action-delete" onclick="deleteProduct('${p.id}')">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');

  const jsonScript = `<script>
    window.__catalogProducts = ${JSON.stringify(products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}))};
  </script>`;

  return `
    <div class="card">
      <h2>Productos en Catálogo (${products.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Nombre & URL</th>
            <th>SKU</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Estado</th>
            <th>Contra Entrega</th>
            <th style="text-align:right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="7" style="padding:1rem; text-align:center; color:#94a3b8;">No hay productos registrados</td></tr>'}
        </tbody>
      </table>
    </div>
    ${jsonScript}
  `;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

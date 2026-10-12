import { CartDto } from '../gateways/cart/CartGateway.js';
import { CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';

export function renderCartPage(
  cart: CartDto,
  productsMap: Map<string, CatalogProductDto>
): string {
  const items = cart.items;
  const subtotalCents = items.reduce((sum, item) => sum + item.subtotalCents, 0);
  const formattedSubtotal = (subtotalCents / 100).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

  if (items.length === 0) {
    return `
      <section style="max-width: 800px; margin: 3rem auto; text-align: center; padding: 3rem 1.5rem; background: var(--surface); border: 1px solid var(--border); border-radius: 8px;">
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">Tu Carrito está Vacío</h1>
        <p style="color: var(--muted); margin-bottom: 2rem; font-size: 1.1rem;">No tienes productos agregados actualmente.</p>
        <a href="/" style="display: inline-block; padding: 0.9rem 2rem; background: var(--accent); color: #fff; text-decoration: none; border-radius: 6px; font-weight: 700;">Explorar Productos</a>
      </section>
    `;
  }

  const itemsHtml = items.map((item) => {
    const prod = productsMap.get(item.productId);
    const name = prod?.name || 'Producto';
    const sku = prod?.sku || '';
    const unitFormatted = (item.unitPriceCents / 100).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
    const totalFormatted = (item.subtotalCents / 100).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });

    return `
      <tr style="border-bottom: 1px solid var(--border);" id="row-${item.id}">
        <td style="padding: 1.25rem 1rem;">
          <strong style="font-size: 1.05rem; display: block;">${escapeHtml(name)}</strong>
          <span style="font-size: 0.85rem; color: var(--muted);">SKU: ${escapeHtml(sku)}</span>
        </td>
        <td style="padding: 1.25rem 1rem; text-align: right;">${unitFormatted}</td>
        <td style="padding: 1.25rem 1rem; text-align: center;">
          <input type="number" min="1" max="99" value="${item.quantity}" style="width: 60px; text-align: center; padding: 0.4rem; border: 1px solid var(--border); border-radius: 4px;"
            onchange="updateItemQty('${item.productId}', this.value)" />
        </td>
        <td style="padding: 1.25rem 1rem; text-align: right; font-weight: 700;">${totalFormatted}</td>
        <td style="padding: 1.25rem 1rem; text-align: center;">
          <button type="button" onclick="removeItem('${item.productId}')" style="background: none; border: none; color: #dc2626; font-size: 1.2rem; cursor: pointer;" title="Eliminar">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <section style="max-width: 1000px; margin: 2rem auto; padding: 0 1rem;">
      <h1 style="font-size: 2rem; margin-bottom: 1.5rem;">Tu Carrito de Compras</h1>
      <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow-x: auto; margin-bottom: 2rem;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background: var(--bg); border-bottom: 2px solid var(--border); font-size: 0.9rem; text-transform: uppercase; color: var(--muted);">
              <th style="padding: 1rem;">Producto</th>
              <th style="padding: 1rem; text-align: right;">Precio Unit.</th>
              <th style="padding: 1rem; text-align: center;">Cantidad</th>
              <th style="padding: 1rem; text-align: right;">Total</th>
              <th style="padding: 1rem; text-align: center;">Acción</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1.5rem;">
        <button type="button" onclick="clearCart()" style="padding: 0.75rem 1.25rem; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-weight: 600;">
          Vaciar Carrito
        </button>

        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; width: 100%; max-width: 360px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 1.25rem; font-size: 1.2rem; font-weight: 700;">
            <span>Subtotal:</span>
            <span style="color: var(--accent);">${formattedSubtotal}</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--muted); margin-bottom: 1.5rem;">
            * Los costos de envío y descuentos por cupón se liquidarán en el siguiente paso de compra.
          </p>
          <a href="/checkout" style="display: block; text-align: center; padding: 1rem; background: var(--accent); color: #fff; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 1.1rem;">
            Proceder al Checkout &rarr;
          </a>
        </div>
      </div>
    </section>

    <script>
      async function updateItemQty(productId, qty) {
        const q = parseInt(qty, 10);
        if (q < 1) return;
        await fetch('/api/v1/cart/items/' + productId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: q })
        });
        window.location.reload();
      }

      async function removeItem(productId) {
        if (!confirm('¿Deseas quitar este producto del carrito?')) return;
        await fetch('/api/v1/cart/items/' + productId, { method: 'DELETE' });
        window.location.reload();
      }

      async function clearCart() {
        if (!confirm('¿Estás seguro de vaciar el carrito?')) return;
        await fetch('/api/v1/cart/clear', { method: 'POST' });
        window.location.reload();
      }
    </script>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

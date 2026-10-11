import { CatalogProductDto } from '../../gateways/catalog/CatalogGateway.js';
import { SettingsDto } from '../../gateways/settings/SettingsGateway.js';

export interface AdminDashboardProps {
  products: CatalogProductDto[];
  settings: SettingsDto;
  adminEmail: string;
}

export function renderAdminDashboardPage(props: AdminDashboardProps): string {
  const productsRows = props.products.map((p) => {
    const formattedPrice = (p.priceInCents / 100).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
    const cod = p.salePolicy.allowsCashOnDelivery ? '✅ Sí' : '❌ No';
    return `
      <tr>
        <td style="padding: 0.75rem; border-bottom: 1px solid #334155;">${escapeHtml(p.name)}</td>
        <td style="padding: 0.75rem; border-bottom: 1px solid #334155; font-family: monospace;">${escapeHtml(p.sku)}</td>
        <td style="padding: 0.75rem; border-bottom: 1px solid #334155;">${formattedPrice}</td>
        <td style="padding: 0.75rem; border-bottom: 1px solid #334155;">${p.stockQuantity}</td>
        <td style="padding: 0.75rem; border-bottom: 1px solid #334155;">${cod}</td>
        <td style="padding: 0.75rem; border-bottom: 1px solid #334155; text-transform: capitalize;">${escapeHtml(p.salePolicy.shippingScope)}</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Panel de Administración | Vega Store</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; }
    header { background: #1e293b; border-bottom: 1px solid #334155; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    .brand { font-size: 1.25rem; font-weight: 700; color: #fff; }
    .nav-user { display: flex; align-items: center; gap: 1rem; font-size: 0.875rem; color: #94a3b8; }
    .btn-logout { background: #dc2626; color: #fff; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; font-weight: 600; }
    .container { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; flex: 1; width: 100%; }
    .tabs { display: flex; gap: 0.5rem; border-bottom: 1px solid #334155; margin-bottom: 1.5rem; }
    .tab-btn { background: transparent; border: none; color: #94a3b8; padding: 0.75rem 1.25rem; font-size: 0.95rem; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; }
    .tab-btn.active { color: #3b82f6; border-bottom-color: #3b82f6; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.25rem; margin-bottom: 1rem; color: #fff; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    label { display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.25rem; color: #cbd5e1; }
    input, select, textarea { width: 100%; padding: 0.6rem; background: #0f172a; border: 1px solid #334155; border-radius: 4px; color: #fff; font-size: 0.9rem; }
    button.btn-primary { background: #2563eb; color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; font-weight: 600; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
    th { padding: 0.75rem; border-bottom: 2px solid #334155; color: #94a3b8; font-weight: 600; }
    .msg { padding: 0.75rem; border-radius: 4px; margin-top: 1rem; display: none; font-size: 0.9rem; }
  </style>
</head>
<body>
  <header>
    <div class="brand">Vega Store — Panel de Control</div>
    <div class="nav-user">
      <span>🛡️ ${escapeHtml(props.adminEmail)}</span>
      <button class="btn-logout" id="logoutBtn">Cerrar Sesión</button>
    </div>
  </header>
  <main class="container">
    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab('products')">Catálogo & Productos</button>
      <button class="tab-btn" onclick="switchTab('storefront')">Banners & Anuncios</button>
      <button class="tab-btn" onclick="switchTab('settings')">Configuración de Tienda</button>
    </div>

    <!-- TAB PRODUCTOS -->
    <div id="tab-products" class="tab-content active">
      <div class="card">
        <h2>Crear Nuevo Producto</h2>
        <form id="newProductForm">
          <div class="form-grid">
            <div><label>Nombre</label><input type="text" id="pName" required placeholder="Ej. Chaqueta Denim" /></div>
            <div><label>Slug</label><input type="text" id="pSlug" required placeholder="chaqueta-denim" /></div>
            <div><label>SKU</label><input type="text" id="pSku" required placeholder="JACKET-001" /></div>
            <div><label>Precio en COP (Ej. 120000)</label><input type="number" id="pPrice" required placeholder="120000" /></div>
            <div><label>Stock</label><input type="number" id="pStock" required value="10" /></div>
            <div>
              <label>Pago Contra Entrega</label>
              <select id="pCod"><option value="true">Sí (Permitido)</option><option value="false">No (Solo Pago Anticipado)</option></select>
            </div>
            <div>
              <label>Alcance de Envío</label>
              <select id="pScope"><option value="national">Nacional (Todo el país)</option><option value="local">Local (Zonas específicas)</option></select>
            </div>
            <div>
              <label>Modalidad de Venta</label>
              <select id="pSaleMode"><option value="cash">Contado</option><option value="credit">Crédito</option><option value="both" selected>Ambas</option></select>
            </div>
          </div>
          <div style="margin-bottom: 1rem;">
            <label>Descripción</label>
            <textarea id="pDesc" rows="2" required placeholder="Detalles de la prenda o producto..."></textarea>
          </div>
          <button type="submit" class="btn-primary">Guardar Producto</button>
          <div id="pMsg" class="msg"></div>
        </form>
      </div>

      <div class="card">
        <h2>Productos en Catálogo (${props.products.length})</h2>
        <table>
          <thead>
            <tr><th>Nombre</th><th>SKU</th><th>Precio</th><th>Stock</th><th>Contra Entrega</th><th>Envío</th></tr>
          </thead>
          <tbody>
            ${productsRows || '<tr><td colspan="6" style="padding:1rem; text-align:center; color:#94a3b8;">No hay productos registrados</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB STOREFRONT -->
    <div id="tab-storefront" class="tab-content">
      <div class="card">
        <h2>Publicar Banner Hero</h2>
        <form id="newBannerForm">
          <div class="form-grid">
            <div><label>Título del Banner</label><input type="text" id="bTitle" required placeholder="Nueva Temporada" /></div>
            <div><label>Enlace de Destino</label><input type="text" id="bLink" required value="/productos" /></div>
            <div><label>Texto Alternativo (Alt)</label><input type="text" id="bAlt" required placeholder="Descripción de la imagen" /></div>
          </div>
          <button type="submit" class="btn-primary">Publicar Banner</button>
          <div id="bMsg" class="msg"></div>
        </form>
      </div>

      <div class="card">
        <h2>Publicar Anuncio Superior (Top Bar)</h2>
        <form id="newAnnouncementForm">
          <div class="form-grid">
            <div style="grid-column: 1 / -1;"><label>Mensaje del Anuncio</label><input type="text" id="aMsgText" required placeholder="🔥 20% de descuento en referencias seleccionadas" /></div>
            <div><label>Enlace Opcional</label><input type="text" id="aLink" placeholder="/productos" /></div>
          </div>
          <button type="submit" class="btn-primary">Publicar Anuncio</button>
          <div id="aMsg" class="msg"></div>
        </form>
      </div>
    </div>

    <!-- TAB SETTINGS -->
    <div id="tab-settings" class="tab-content">
      <div class="card">
        <h2>Configuración de la Tienda</h2>
        <form id="settingsForm">
          <div class="form-grid">
            <div><label>Nombre de la Tienda</label><input type="text" id="sName" value="${escapeHtml(props.settings.storeName)}" required /></div>
            <div><label>Moneda</label><input type="text" id="sCurrency" value="${escapeHtml(props.settings.currency)}" readonly style="opacity:0.6;" /></div>
            <div><label>Tasa de IVA (%)</label><input type="number" id="sTax" value="${props.settings.taxRatePercent}" required /></div>
            <div><label>Email de Soporte</label><input type="email" id="sEmail" value="${escapeHtml(props.settings.supportEmail || '')}" /></div>
            <div><label>Teléfono de Soporte</label><input type="text" id="sPhone" value="${escapeHtml(props.settings.supportPhone || '')}" /></div>
          </div>
          <button type="submit" class="btn-primary">Guardar Configuración</button>
          <div id="sMsg" class="msg"></div>
        </form>
      </div>
    </div>
  </main>

  <script>
    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById('tab-' + tabId).classList.add('active');
    }

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await fetch('/api/v1/admin/auth/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    });

    document.getElementById('newProductForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('pMsg');
      const payload = {
        name: document.getElementById('pName').value,
        slug: document.getElementById('pSlug').value,
        sku: document.getElementById('pSku').value,
        priceInCents: Math.round(Number(document.getElementById('pPrice').value) * 100),
        stockQuantity: Number(document.getElementById('pStock').value),
        allowsCashOnDelivery: document.getElementById('pCod').value === 'true',
        shippingScope: document.getElementById('pScope').value,
        saleMode: document.getElementById('pSaleMode').value,
        description: document.getElementById('pDesc').value,
        status: 'published'
      };

      try {
        const res = await fetch('/api/v1/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          msg.textContent = '✅ Producto creado con éxito';
          msg.style.background = '#065f46';
          msg.style.display = 'block';
          setTimeout(() => window.location.reload(), 1000);
        } else {
          msg.textContent = '❌ ' + (data.error || 'Error al guardar');
          msg.style.background = '#7f1d1d';
          msg.style.display = 'block';
        }
      } catch {
        msg.textContent = '❌ Error de conexión';
        msg.style.display = 'block';
      }
    });

    document.getElementById('newBannerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('bMsg');
      const payload = {
        title: document.getElementById('bTitle').value,
        linkUrl: document.getElementById('bLink').value,
        altText: document.getElementById('bAlt').value,
        imageUrl: '/media/banner-default.webp',
        placement: 'home'
      };
      const res = await fetch('/api/v1/admin/storefront/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        msg.textContent = '✅ Banner publicado con éxito';
        msg.style.background = '#065f46';
        msg.style.display = 'block';
      }
    });

    document.getElementById('newAnnouncementForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('aMsg');
      const payload = {
        message: document.getElementById('aMsgText').value,
        linkUrl: document.getElementById('aLink').value || undefined,
        placement: 'top_bar'
      };
      const res = await fetch('/api/v1/admin/storefront/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        msg.textContent = '✅ Anuncio superior publicado';
        msg.style.background = '#065f46';
        msg.style.display = 'block';
      }
    });

    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('sMsg');
      const payload = {
        storeName: document.getElementById('sName').value,
        taxRatePercent: Number(document.getElementById('sTax').value),
        supportEmail: document.getElementById('sEmail').value || undefined,
        supportPhone: document.getElementById('sPhone').value || undefined
      };
      const res = await fetch('/api/v1/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        msg.textContent = '✅ Configuración actualizada con éxito';
        msg.style.background = '#065f46';
        msg.style.display = 'block';
      }
    });
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

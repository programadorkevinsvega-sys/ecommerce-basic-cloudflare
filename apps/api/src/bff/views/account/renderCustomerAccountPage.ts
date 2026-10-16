export interface CustomerAccountViewProps {
  customer: {
    id: string;
    email: string;
    fullName?: string;
  };
  orders: any[];
  invoices: any[];
}

export function renderCustomerAccountPage(props: CustomerAccountViewProps): string {
  const { customer, orders, invoices } = props;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mi Cuenta | Vega Store</title>
  <style>
    :root { --bg: #f2f4ef; --card: #fff; --text: #18211c; --muted: #68736b; --border: #dfe5dc; --primary: #20563c; }
    * { box-sizing: border-box; }
    body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; background: var(--bg); color: var(--text); margin: 0; }
    .nav { background: var(--card); border-bottom: 1px solid var(--border); padding: 1rem max(1.25rem,calc((100% - 1120px)/2)); display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
    .brand { font-size: 1.1rem; font-weight: 800; color: var(--text); text-decoration: none; letter-spacing: .04em; }
    .container { max-width: 1120px; margin: 2.5rem auto 5rem; padding: 0 1.25rem; }
    .eyebrow { color: var(--primary); font-size: .75rem; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
    .container > h1 { font-size: clamp(2rem,4vw,3rem); letter-spacing: -.04em; margin: .5rem 0 1.75rem; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 18px; padding: clamp(1.25rem,3vw,2rem); margin-bottom: 1.25rem; box-shadow: 0 10px 30px #18211c08; }
    h2 { font-size: 1.2rem; margin: 0 0 1rem; }
    table { width: 100%; border-collapse: collapse; text-align: left; margin-top: 1rem; }
    th { padding: .85rem; border-bottom: 1px solid var(--border); background: #f7f8f5; font-size: .75rem; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
    td { padding: .9rem .85rem; border-bottom: 1px solid var(--border); font-size: .9rem; }
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: .65rem .9rem; border-radius: 9px; text-decoration: none; font-size: .85rem; font-weight: 700; cursor: pointer; border: 1px solid var(--border); }
    .btn-primary { background: var(--primary); border-color: var(--primary); color: #fff; }
    .btn-outline { background: #fff; color: var(--text); }
    .btn-logout { background: #fff; color: #9b2c2c; border-color: #ead6d3; }
    .btn-logout:hover { background: #fff6f4; }
    .tag { display: inline-block; padding: .3rem .65rem; border-radius: 999px; background: #edf3ee; color: var(--primary); font-size: .75rem; font-weight: 700; }
    .account-actions { display:flex;gap:.65rem;flex-wrap:wrap;margin-top:1.25rem; }
    @media(max-width:640px){.nav{padding:1rem;flex-wrap:wrap}.container{margin-top:1.5rem}td,th{padding:.65rem .5rem;font-size:.8rem}}
  </style>
</head>
<body>
  <div class="nav">
    <a href="/" class="brand">VEGA STORE</a>
    <div>
        <span style="margin-right: 1rem; color: var(--muted);">👤 ${escapeHtml(customer.email)}</span>
      <div style="display:flex;gap:.55rem;align-items:center;flex-wrap:wrap">
        <a href="/" class="btn btn-outline">Volver a la Tienda</a>
        <button id="customer-logout" class="btn btn-logout" type="button">Cerrar sesión</button>
      </div>
    </div>
  </div>

  <div class="container">
    <span class="eyebrow">VEGA STORE · CUENTA</span>
    <h1>Hola, ${escapeHtml(customer.fullName || 'cliente')}</h1>

    <div class="card">
      <h2>👤 Mis Datos</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.95rem;">
        <div><strong>Email:</strong> ${escapeHtml(customer.email)}</div>
        <div><strong>Nombre:</strong> ${escapeHtml(customer.fullName || 'No especificado')}</div>
      </div>
      <div class="account-actions">
        <a class="btn btn-outline" href="/cuenta/perfil">Editar perfil</a>
        <a class="btn btn-outline" href="/cuenta/seguridad">Seguridad y sesiones</a>
      </div>
    </div>

    <div class="card">
      <h2>📦 Mis Pedidos y Facturas</h2>
      ${orders.length === 0 ? `
        <p style="color: var(--muted); text-align: center; padding: 2rem 0;">Aún no has realizado pedidos.</p>
      ` : `
        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th>ID Pedido</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado Pedido</th>
                <th>Estado Pago</th>
                <th>Factura</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map((o) => {
                const inv = invoices.find((i) => i.orderId === o.id);
                return `
                  <tr>
                    <td><code style="color: var(--primary); font-weight: 700;">#${escapeHtml(o.id.replace('ord-', ''))}</code></td>
                    <td>${new Date(o.createdAt).toLocaleDateString('es-CO')}</td>
                    <td><strong>$${(o.totalCents / 100).toLocaleString('es-CO')}</strong></td>
                    <td><span class="tag">${escapeHtml(o.status)}</span></td>
                    <td><span class="tag">${escapeHtml(o.paymentStatus)}</span></td>
                    <td>
                      ${inv ? `
                        <a href="/api/v1/invoices/${inv.id}/document?view=1" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="font-size:0.8rem;">
                          🧾 Ver PDF ${inv.invoiceNumber}
                        </a>
                        <a href="/api/v1/invoices/${inv.id}/document" class="btn btn-secondary" style="font-size:0.8rem;">
                          Descargar
                        </a>
                      ` : `
                        <span style="color:var(--muted); font-size:0.8rem;">En proceso</span>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  </div>
  <script>
    document.getElementById('customer-logout')?.addEventListener('click', async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      button.textContent = 'Cerrando sesión…';
      try {
        const response = await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'same-origin' });
        if (!response.ok) throw new Error('No fue posible cerrar la sesión.');
        window.location.assign('/');
      } catch {
        button.disabled = false;
        button.textContent = 'Cerrar sesión';
        window.alert('No fue posible cerrar la sesión. Inténtalo de nuevo.');
      }
    });
  </script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char] || char));
}

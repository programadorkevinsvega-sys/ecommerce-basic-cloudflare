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
    :root { --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --muted: #94a3b8; --border: #334155; --primary: #0284c7; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 0; }
    .nav { background: var(--card); border-bottom: 1px solid var(--border); padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    .brand { font-size: 1.25rem; font-weight: 800; color: #38bdf8; text-decoration: none; }
    .container { max-width: 1000px; margin: 2.5rem auto; padding: 0 1.5rem; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 1.75rem; margin-bottom: 2rem; }
    h1 { font-size: 1.8rem; margin: 0 0 1.5rem 0; }
    h2 { font-size: 1.25rem; margin: 0 0 1rem 0; color: #38bdf8; }
    table { width: 100%; border-collapse: collapse; text-align: left; margin-top: 1rem; }
    th { padding: 0.75rem; border-bottom: 2px solid var(--border); font-size: 0.8rem; text-transform: uppercase; color: var(--muted); }
    td { padding: 0.85rem 0.75rem; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
    .btn { display: inline-block; padding: 0.4rem 0.8rem; border-radius: 6px; text-decoration: none; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text); }
    .tag { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
  </style>
</head>
<body>
  <div class="nav">
    <a href="/" class="brand">VEGA STORE</a>
    <div>
        <span style="margin-right: 1rem; color: var(--muted);">👤 ${escapeHtml(customer.email)}</span>
      <a href="/" class="btn btn-outline">Volver a la Tienda</a>
    </div>
  </div>

  <div class="container">
    <h1>Mi Cuenta de Cliente</h1>

    <div class="card">
      <h2>👤 Mis Datos</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.95rem;">
        <div><strong>Email:</strong> ${escapeHtml(customer.email)}</div>
        <div><strong>Nombre:</strong> ${escapeHtml(customer.fullName || 'No especificado')}</div>
      </div>
      <div style="display:flex;gap:.65rem;flex-wrap:wrap;margin-top:1.25rem">
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
                    <td><code style="color: #38bdf8; font-weight: 700;">#${o.id.replace('ord-', '')}</code></td>
                    <td>${new Date(o.createdAt).toLocaleDateString('es-CO')}</td>
                    <td><strong>$${(o.totalCents / 100).toLocaleString('es-CO')}</strong></td>
                    <td><span class="tag" style="background:#334155; color:#fff;">${o.status}</span></td>
                    <td><span class="tag" style="background:${o.paymentStatus === 'approved' ? '#14532d' : '#78350f'}; color:#fff;">${o.paymentStatus}</span></td>
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
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char] || char));
}

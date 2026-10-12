import { Order } from '../../modules/orders/domain/entities/Order.js';

export function renderCheckoutResultPage(order: Order, ref?: string): string {
  const isCod = order.paymentMethod === 'cash_on_delivery';
  const totalFormatted = (order.totalCents / 100).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

  return `
    <section style="max-width: 700px; margin: 3rem auto; padding: 2rem; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; text-align: center;">
      <div style="font-size: 3.5rem; margin-bottom: 1rem;">
        ${isCod ? '📦' : '🎉'}
      </div>
      <h1 style="font-size: 2rem; margin-bottom: 0.5rem;">
        ${isCod ? '¡Pedido Contra Entrega Confirmado!' : '¡Gracias por tu compra!'}
      </h1>
      <p style="color: var(--muted); font-size: 1.1rem; margin-bottom: 2rem;">
        Número de Pedido: <strong>#${order.id}</strong>
        ${ref ? `<br><span style="font-size:0.9rem;">Referencia de Transacción: <code>${escapeHtml(ref)}</code></span>` : ''}
      </p>

      <div style="background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 1.5rem; text-align: left; margin-bottom: 2rem;">
        <h3 style="font-size: 1.1rem; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">Detalles del Envío</h3>
        <p style="margin-bottom: 0.4rem;"><strong>Destinatario:</strong> ${escapeHtml(order.customerName)}</p>
        <p style="margin-bottom: 0.4rem;"><strong>Teléfono:</strong> ${escapeHtml(order.customerPhone)}</p>
        <p style="margin-bottom: 0.4rem;"><strong>Dirección:</strong> ${escapeHtml(order.shippingAddress.addressLine)}, ${escapeHtml(order.shippingAddress.municipality)}, ${escapeHtml(order.shippingAddress.department)}</p>
        <p style="margin-bottom: 0.4rem;"><strong>Método de Pago:</strong> ${isCod ? '💵 Pago Contra Entrega (Efectivo al recibir)' : '💳 Pago en línea (Wompi)'}</p>
        <p style="margin-bottom: 0; font-size: 1.2rem; font-weight: 700; color: var(--accent); margin-top: 0.75rem;">
          Total a Pagar: ${totalFormatted}
        </p>
      </div>

      <div style="display: flex; justify-content: center; gap: 1rem;">
        <a href="/" style="padding: 0.8rem 1.5rem; background: var(--accent); color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">Volver al Inicio</a>
      </div>
    </section>
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

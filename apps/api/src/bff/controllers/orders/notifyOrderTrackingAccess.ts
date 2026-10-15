import { Order } from '../../../modules/orders/domain/entities/Order.js';
import { NotificationsGateway } from '../../gateways/notifications/NotificationsGateway.js';

export async function notifyOrderTrackingAccess(
  order: Order,
  token: string,
  notifications: NotificationsGateway,
  origin: string,
  traceId: string,
): Promise<void> {
  try {
    await notifications.sendEmail({
      recipientEmail: order.customerEmail,
      templateName: 'order_tracking_access',
      subject: `Seguimiento seguro de tu pedido #${order.id}`,
      idempotencyKey: `order_tracking_access_${order.id}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#18251e;line-height:1.6"><h1>Seguimiento de tu pedido</h1><p>Conserva estos datos para consultar el avance de tu compra.</p><p><strong>Número de pedido:</strong> ${escapeHtml(order.id)}</p><p><strong>Clave privada de seguimiento:</strong></p><p style="padding:14px;background:#f1f5f1;word-break:break-all"><code>${escapeHtml(token)}</code></p><p>Ingresa ambos datos en <a href="${escapeHtml(origin)}/seguimiento-pedido">Seguimiento de pedidos</a>. La clave no se incluye en el enlace.</p><p>Por seguridad, no compartas esta clave.</p></div>`,
    });
  } catch {
    console.error(JSON.stringify({ event: 'orders.tracking_email_failed', order_id: order.id, trace_id: traceId }));
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char);
}

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
      subject: 'Tu pedido está confirmado | Vega Store',
      idempotencyKey: `order_tracking_access_${order.id}`,
      text: `Hola ${order.customerName},\n\nRecibimos tu pedido en Vega Store. Puedes consultar su avance con estos datos:\n\nNúmero de pedido: ${order.id}\nClave privada: ${token}\n\nSeguimiento: ${origin}/seguimiento-pedido\n\nGuarda la clave y no la compartas. Este mensaje se envió porque se creó un pedido con tu correo. Si no reconoces la compra, contacta a Vega Store desde su sitio.`,
      html: `<div lang="es" style="font-family:Arial,sans-serif;max-width:620px;margin:24px auto;padding:24px;color:#18251e;line-height:1.6;border:1px solid #e1e4da;border-radius:12px"><p style="margin:0 0 8px;color:#1f4d3a;font-weight:bold;letter-spacing:.08em">VEGA STORE</p><h1 style="font-size:24px;margin:0 0 16px">Tu pedido está confirmado</h1><p>Hola ${escapeHtml(order.customerName)}. Recibimos tu pedido y puedes consultar su avance cuando quieras.</p><p><strong>Número de pedido</strong><br>${escapeHtml(order.id)}</p><p><strong>Clave privada de seguimiento</strong></p><p style="padding:12px 16px;background:#f3f4ef;border-radius:8px;word-break:break-all"><code>${escapeHtml(token)}</code></p><p><a href="${escapeHtml(origin)}/seguimiento-pedido" style="display:inline-block;padding:12px 18px;background:#1f4d3a;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">Consultar mi pedido</a></p><p>Guarda esta clave y no la compartas. Este mensaje se envió porque se creó un pedido con tu correo. Si no reconoces la compra, contacta a Vega Store desde su sitio.</p></div>`,
    });
  } catch {
    console.error(JSON.stringify({ event: 'orders.tracking_email_failed', order_id: order.id, trace_id: traceId }));
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char);
}

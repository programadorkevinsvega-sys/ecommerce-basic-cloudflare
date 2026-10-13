import { Order } from '../../../modules/orders/domain/entities/Order.js';
import { NotificationsGateway } from '../../gateways/notifications/NotificationsGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { OrderEmailTemplates } from '../payments/OrderEmailTemplates.js';

export async function notifyCodOrderPlaced(
  order: Order,
  notificationsGateway: NotificationsGateway,
  settingsGateway: SettingsGateway,
  traceId: string
): Promise<void> {
  try {
    // 1. Email al cliente
    const custHtml = OrderEmailTemplates.renderCustomerCodEmail(order);
    await notificationsGateway.sendEmail({
      recipientEmail: order.customerEmail,
      templateName: 'order_placed_cod_customer',
      subject: `¡Pedido Recibido #${order.id}! — Pago Contra Entrega`,
      idempotencyKey: `email_cod_cust_${order.id}`,
      html: custHtml,
    });

    // 2. Email de alerta a la empresa
    const storeSettings = await settingsGateway.getSettings().catch(() => null);
    const adminEmail = storeSettings?.supportEmail || 'contacto@tienda.com';
    const adminHtml = OrderEmailTemplates.renderAdminCodAlertEmail(order);

    await notificationsGateway.sendEmail({
      recipientEmail: adminEmail,
      templateName: 'order_placed_cod_admin',
      subject: `🚚 [NUEVO PEDIDO CONTRA ENTREGA] #${order.id} ($${(order.totalCents / 100).toLocaleString('es-CO')} COP)`,
      idempotencyKey: `email_cod_admin_${order.id}`,
      html: adminHtml,
    });
  } catch {
    console.error(JSON.stringify({ event: 'orders.cod_notification_failed', order_id: order.id, trace_id: traceId }));
  }
}

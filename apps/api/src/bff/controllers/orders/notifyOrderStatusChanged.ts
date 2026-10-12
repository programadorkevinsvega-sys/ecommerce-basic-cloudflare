import { Order } from '../../../modules/orders/domain/entities/Order.js';
import { NotificationsGateway } from '../../gateways/notifications/NotificationsGateway.js';
import { OrderStatusEmailTemplates } from './OrderStatusEmailTemplates.js';

export async function notifyOrderStatusChanged(
  order: Order,
  newStatus: string,
  note: string | undefined,
  notificationsGateway: NotificationsGateway
): Promise<void> {
  if (!order.customerEmail) return;

  let templateData: { subject: string; html: string } | null = null;
  const templateName = `order_status_${newStatus}`;

  if (newStatus === 'shipped') {
    templateData = OrderStatusEmailTemplates.renderShippedEmail(order, note);
  } else if (newStatus === 'delivered') {
    templateData = OrderStatusEmailTemplates.renderDeliveredEmail(order, note);
  } else if (newStatus === 'cancelled') {
    templateData = OrderStatusEmailTemplates.renderCancelledEmail(order, note);
  }

  if (!templateData) return;

  try {
    await notificationsGateway.sendEmail({
      recipientEmail: order.customerEmail,
      templateName,
      subject: templateData.subject,
      idempotencyKey: `email_st_${order.id}_${newStatus}`,
      html: templateData.html,
    });
  } catch (err) {
    console.error(`[notifyOrderStatusChanged] Error enviando email (${newStatus}):`, err);
  }
}

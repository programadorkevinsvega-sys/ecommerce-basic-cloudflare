import { NotificationsGateway } from '../../gateways/notifications/NotificationsGateway.js';
import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { OrderGuideEmailTemplate } from './OrderGuideEmailTemplate.js';

export async function notifyShippingGuideAvailable(
  orderId: string,
  orders: OrdersGateway,
  notifications: NotificationsGateway,
): Promise<void> {
  const [order, tracking] = await Promise.all([
    orders.getOrder(orderId), orders.getAdminOrderTracking(orderId),
  ]);
  if (!order || !tracking?.shippingTrackingNumber || !tracking.shippingCarrier) return;

  const amountToCollectCents = order.paymentMethod === 'cash_on_delivery'
    ? order.totalCents + order.shippingCollectionCents
    : order.shippingCollectionCents;
  const guideHash = await hashGuide(tracking.shippingTrackingNumber);
  try {
    const result = await notifications.sendEmail({
      recipientEmail: tracking.customerEmail,
      templateName: 'order_shipping_guide_available',
      subject: `Tu pedido #${order.id} ya tiene guía de envío`,
      idempotencyKey: `shipping_guide_${order.id}_${guideHash}`,
      html: OrderGuideEmailTemplate.render({
        orderId: tracking.orderId,
        customerName: tracking.customerName,
        carrier: tracking.shippingCarrier,
        guideNumber: tracking.shippingTrackingNumber,
        estimatedDeliveryDate: tracking.estimatedDeliveryDate,
        minEstimatedDays: tracking.minEstimatedDays,
        maxEstimatedDays: tracking.maxEstimatedDays,
        amountToCollectCents,
        trackingUrl: `https://ecommerce-basic-cloudflare.programadorkevinsvega.workers.dev/seguimiento-pedido?pedido=${encodeURIComponent(order.id)}`,
      }),
    });
    if (!result.success) throw new Error('Email provider rejected guide message');
  } catch (error) {
    console.error(JSON.stringify({ event: 'shipping.guide_email_failed', order_id: order.id,
      error_name: error instanceof Error ? error.name : 'UnknownError' }));
  }
}

async function hashGuide(guideNumber: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(guideNumber));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

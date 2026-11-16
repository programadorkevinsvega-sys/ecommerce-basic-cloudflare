import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { PromotionsGateway } from '../../gateways/promotions/PromotionsGateway.js';

export async function cancelOrderAndReleaseCouponRedemption(
  orders: OrdersGateway,
  promotions: PromotionsGateway,
  input: { orderId: string; note: string; actor: string; paymentStatus?: 'failed' },
): Promise<Awaited<ReturnType<OrdersGateway['updateOrderStatus']>>> {
  const updated = await orders.updateOrderStatus({
    orderId: input.orderId, status: 'cancelled', paymentStatus: input.paymentStatus,
    note: input.note, actor: input.actor,
  });
  try {
    await promotions.releaseCouponRedemption(input.orderId);
  } catch (error) {
    console.error(JSON.stringify({
      event: 'orders.coupon_redemption_release_failed',
      order_id: input.orderId,
      error_name: error instanceof Error ? error.name : 'UnknownError',
    }));
    throw error;
  }
  return updated;
}

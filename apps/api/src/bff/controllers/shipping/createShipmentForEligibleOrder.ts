import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { ShippingGateway } from '../../gateways/shipping/ShippingGateway.js';
import { NotificationsGateway } from '../../gateways/notifications/NotificationsGateway.js';
import { notifyShippingGuideAvailable } from './notifyShippingGuideAvailable.js';

export async function createShipmentForEligibleOrder(orderId: string, deps: {
  orders: OrdersGateway; settings: SettingsGateway; shipping: ShippingGateway; notifications: NotificationsGateway;
}): Promise<void> {
  const order = await deps.orders.getOrder(orderId);
  if (!order || order.status === 'cancelled') return;
  const settings = await deps.settings.getSettings();
  const sender = makeParty(settings.companyLegalName || settings.storeName, settings.companyNit,
    settings.supportPhone, settings.supportEmail, settings.companyAddress, settings.companyNit);
  const recipient = makeParty(order.customerName, order.customerTaxId,
    order.customerPhone, order.customerEmail, order.shippingAddress.addressLine, order.customerTaxId);
  const shipment = await deps.shipping.createMiPaqueteShipment({
    orderId: order.id, status: order.status, paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod, totalCents: order.totalCents,
    shippingCostCents: order.shippingCostCents, transactionFeeCents: order.transactionFeeCents,
    shippingDiscountCents: order.shippingDiscountCents,
    shippingCollectionCents: order.shippingCollectionCents, shippingChargeMode: order.shippingChargeMode,
    destinationDaneCode: `${order.shippingAddress.daneCode}000`,
    destinationAddress: order.shippingAddress.addressLine, recipient, sender,
    description: order.lines.map((line) => `${line.quantity}x ${line.productName}`).join(', ').slice(0, 200),
  });
  if (shipment.guideNumber) await deps.orders.saveOrderShippingDetails(order.id, {
    shippingCarrier: shipment.carrierName || 'MiPaquete', shippingTrackingNumber: shipment.guideNumber,
    shippingTrackingUrl: shipment.guideUrl, estimatedDeliveryDate: null,
  });
  if (shipment.guideNumber) await notifyShippingGuideAvailable(order.id, deps.orders, deps.notifications);
}

function makeParty(name: string, identification: string | undefined | null, phone: string | undefined,
  email: string, address: string | undefined, taxId?: string | null) {
  if (!identification?.trim() || !phone?.trim() || !email.trim() || !address?.trim()) throw new Error('Faltan datos requeridos para la guía.');
  const parts = name.trim().split(/\s+/);
  return { name: parts[0] || 'Cliente', surname: parts.slice(1).join(' ') || parts[0] || 'Cliente',
    phone: phone.replace(/\D/g, '').slice(-10), email: email.trim(), address: address.trim(),
    identification: identification.trim(), identificationType: taxId && taxId.length > 10 ? 'NIT' as const : 'CC' as const };
}

import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { ShippingZoneDto } from '../../gateways/shipping/ShippingGateway.js';
import { ShippingGateway } from '../../gateways/shipping/ShippingGateway.js';
import { AuthoritativeOrderPricing } from './calculateOrderPricing.js';

export async function validateOrderPolicy(
  orders: OrdersGateway,
  zone: ShippingZoneDto,
  pricing: AuthoritativeOrderPricing,
  paymentMethod: string,
  daneCode: string,
  shipping: ShippingGateway,
): Promise<string | null> {
  const coverage = await Promise.all(pricing.policyItems.map((item) => shipping.checkCoverage(
    daneCode,
    item.product.shippingScope,
    item.product.localCoverageZones,
  )));
  const covered = coverage.every((result) => result.isCovered && result.zoneId === zone.id);
  const policy = await orders.evaluateCheckoutPolicy({
    destinationZoneId: zone.id,
    zoneAllowsCod: zone.allowsCashOnDelivery,
    isDestinationCovered: covered,
    items: pricing.policyItems,
  });
  if (!policy.canProceed) return 'El destino no cumple las reglas de envío del pedido';
  if (paymentMethod === 'cash_on_delivery' && !policy.allowsCashOnDelivery) return 'El pago contra entrega no está disponible para este pedido';
  return null;
}

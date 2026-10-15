import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { ShippingZoneDto } from '../../gateways/shipping/ShippingGateway.js';
import { ShippingGateway } from '../../gateways/shipping/ShippingGateway.js';
import { AuthoritativeOrderPricing } from './calculateOrderPricing.js';

export async function validateOrderPolicy(
  orders: OrdersGateway,
  zone: ShippingZoneDto,
  pricing: AuthoritativeOrderPricing,
  paymentMethod: 'wompi' | 'cash_on_delivery',
  daneCode: string,
  shipping: ShippingGateway,
): Promise<string | null> {
  const coverage = await Promise.all(pricing.policyItems.map((item) => shipping.checkCoverage(
    daneCode,
    item.product.shippingScope,
    item.product.shippingScope === 'local' ? item.product.localCoverageZones : [zone.id],
  )));
  const covered = coverage.every((result) => result.isCovered && result.zoneId === zone.id);
  const nationalCarrierAvailable = zone.type === 'national' && await shipping.getCarrierAvailability();
  const policy = await orders.evaluateCheckoutPolicy({
    destinationZoneId: zone.id,
    zoneAllowsCod: zone.type === 'national' ? nationalCarrierAvailable : zone.allowsCashOnDelivery,
    isDestinationCovered: covered,
    items: pricing.policyItems,
  });
  if (!policy.canProceed) return 'El destino no cumple las reglas de envío del pedido';
  if (!policy.allowedPaymentMethods.includes(paymentMethod)) return 'El método de pago no está habilitado para todos los productos';
  return null;
}

import { Order } from '../../../modules/orders/domain/entities/Order.js';

export interface BuildWompiCheckoutUrlParams {
  order: Order;
  publicKey: string;
  reference: string;
  signature: string;
  origin: string;
}

/**
 * Construye la URL hosted de checkout de Wompi con parámetros obligatorios
 * y datos pre-rellenados de cliente y dirección de envío.
 */
export function buildWompiCheckoutUrl(params: BuildWompiCheckoutUrlParams): string {
  const { order, publicKey, reference, signature, origin } = params;
  const url = new URL('https://checkout.wompi.co/p/');

  url.searchParams.set('public-key', publicKey);
  url.searchParams.set('currency', 'COP');
  url.searchParams.set('amount-in-cents', String(order.totalCents));
  url.searchParams.set('reference', reference);
  url.searchParams.set('signature:integrity', signature);
  url.searchParams.set('redirect-url', `${origin}/checkout/resultado?orderId=${order.id}`);

  const addr = order.shippingAddress;
  if (addr) {
    url.searchParams.set('shipping-address:address-line-1', addr.addressLine || '');
    url.searchParams.set('shipping-address:country', 'CO');
    url.searchParams.set('shipping-address:city', addr.municipality || addr.department || '');
    url.searchParams.set('shipping-address:phone-number', order.customerPhone || '');
    url.searchParams.set('shipping-address:region', addr.department || '');
  }

  url.searchParams.set('customer-data:email', order.customerEmail || '');
  url.searchParams.set('customer-data:full-name', order.customerName || '');
  url.searchParams.set('customer-data:phone-number', (order.customerPhone || '').replace(/^\+57/, ''));
  url.searchParams.set('customer-data:phone-number-prefix', '+57');

  return url.toString();
}

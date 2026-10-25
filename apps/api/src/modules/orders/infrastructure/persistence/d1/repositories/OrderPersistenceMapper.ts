import { Order, OrderPaymentStatus, OrderStatus, ShippingAddressSnapshot } from '../../../../domain/entities/Order.js';
import { OrderLine } from '../../../../domain/entities/OrderLine.js';

export interface OrderRow {
  id: string; customer_id: string | null; guest_cart_id_hash: string | null;
  customer_email: string; customer_name: string; customer_phone: string;
  customer_tax_id?: string | null; customer_tax_id_type?: 'CC' | 'NIT'; customer_legal_organization_code?: '1' | '2';
  shipping_address: string; shipping_zone_id: string; shipping_cost_cents: number;
  shipping_discount_cents?: number; shipping_collection_cents?: number;
  shipping_charge_mode?: 'included' | 'collect_at_delivery';
  shipping_fulfillment_method?: 'merchant_local' | 'carrier' | 'legacy';
  subtotal_cents: number; discount_cents: number; coupon_code: string | null; total_cents: number;
  tax_cents: number; pricing_version: number; estimated_payment_fee_cents: number;
  transaction_fee_cents: number; guest_tracking_token_hash?: string | null;
  min_estimated_days?: number | null; max_estimated_days?: number | null;
  payment_method: string; status: string; payment_status: string; created_at: string; updated_at: string;
}

export interface OrderLineRow {
  id: string; order_id: string; product_id: string; product_name: string;
  product_sku: string; quantity: number; unit_price_cents: number; total_cents: number;
  electronic_invoice_enabled?: number;
}

export function hydrateD1Order(row: OrderRow, lines: OrderLine[]): Order {
  let legacyAddress: Record<string, unknown> = {};
  try { legacyAddress = JSON.parse(row.shipping_address) as Record<string, unknown>; } catch { /* old invalid snapshots hydrate with empty optional fields */ }
  const shippingAddress = { ...legacyAddress };
  delete shippingAddress.customerTaxId;
  delete shippingAddress.customerTaxIdType;
  delete shippingAddress.customerLegalOrganizationCode;
  return new Order({
    id: row.id, customerId: row.customer_id, guestCartIdHash: row.guest_cart_id_hash,
    customerEmail: row.customer_email, customerName: row.customer_name, customerPhone: row.customer_phone,
    customerTaxId: row.customer_tax_id || String(legacyAddress.customerTaxId || '') || null,
    customerTaxIdType: row.customer_tax_id_type || (legacyAddress.customerTaxIdType === 'NIT' ? 'NIT' : 'CC'),
    customerLegalOrganizationCode: row.customer_legal_organization_code || (legacyAddress.customerLegalOrganizationCode === '1' ? '1' : '2'),
    shippingAddress: shippingAddress as unknown as ShippingAddressSnapshot,
    shippingZoneId: row.shipping_zone_id, shippingCostCents: row.shipping_cost_cents,
    shippingDiscountCents: row.shipping_discount_cents ?? 0, shippingCollectionCents: row.shipping_collection_cents ?? 0,
    shippingChargeMode: row.shipping_charge_mode ?? 'included', shippingFulfillmentMethod: row.shipping_fulfillment_method ?? 'legacy',
    subtotalCents: row.subtotal_cents, discountCents: row.discount_cents, couponCode: row.coupon_code,
    totalCents: row.total_cents, taxCents: row.tax_cents ?? 0, pricingVersion: row.pricing_version ?? 1,
    estimatedPaymentFeeCents: row.estimated_payment_fee_cents ?? 0, transactionFeeCents: row.transaction_fee_cents ?? 0,
    guestTrackingTokenHash: row.guest_tracking_token_hash ?? null, minEstimatedDays: row.min_estimated_days ?? null,
    maxEstimatedDays: row.max_estimated_days ?? null,
    paymentMethod: row.payment_method as 'wompi' | 'cash_on_delivery', status: row.status as OrderStatus,
    paymentStatus: row.payment_status as OrderPaymentStatus, lines, createdAt: row.created_at, updatedAt: row.updated_at,
  });
}

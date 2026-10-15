import { PackedOrderItem } from '../../domain/services/PackOrderIntoConfiguredBox.js';

export async function createCarrierPackageFingerprint(input: {
  items: PackedOrderItem[]; paymentMethod: 'wompi' | 'cash_on_delivery';
  declaredValueCents: number; saleValueCents: number;
}): Promise<string> {
  const items = input.items.map((item) => ({ ...item })).sort((a, b) => a.productId.localeCompare(b.productId));
  const canonical = JSON.stringify({ items, paymentMethod: input.paymentMethod,
    declaredValueCents: input.declaredValueCents, saleValueCents: input.saleValueCents });
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
}

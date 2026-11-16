export function resolveFactusPaymentMethodCode(method: unknown): string {
  const value = method && typeof method === 'object' ? method as Record<string, unknown> : {};
  const extra = value.extra && typeof value.extra === 'object'
    ? value.extra as Record<string, unknown> : {};
  const type = String(value.type || '').toUpperCase();
  if (type === 'CARD') return String(extra.card_type || '').toUpperCase() === 'DEBIT' ? '49' : '48';
  if (['PSE', 'NEQUI', 'BANCOLOMBIA_TRANSFER'].includes(type)) return '47';
  if (type === 'CASH') return '10';
  return '1';
}

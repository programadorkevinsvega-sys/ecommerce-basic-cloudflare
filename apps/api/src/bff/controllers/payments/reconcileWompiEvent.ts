import { Env } from '../../../platform/Env.js';

export async function reconcileWompiEvent(body: any, env: Env): Promise<{ transaction: any } | null> {
  const eventTransaction = body?.data?.transaction;
  if (typeof eventTransaction?.id !== 'string' || typeof eventTransaction.reference !== 'string' ||
      !Number.isSafeInteger(eventTransaction.amount_in_cents) || typeof eventTransaction.currency !== 'string') return null;
  const privateKey = env.WOMPI_PRIVATE_KEY;
  if (!privateKey) throw new Error('WOMPI_NOT_CONFIGURED');
  const environment = env.WOMPI_ENVIRONMENT ?? (privateKey.startsWith('prv_test_') ? 'sandbox' : 'production');
  const eventEnvironment = body?.environment === 'test' ? 'sandbox' : body?.environment === 'prod' ? 'production' : undefined;
  if ((environment === 'sandbox') !== privateKey.startsWith('prv_test_') ||
      (body?.environment && eventEnvironment !== environment)) return null;
  const apiRoot = environment === 'sandbox' ? 'https://sandbox.wompi.co/v1' : 'https://production.wompi.co/v1';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${apiRoot}/transactions/${encodeURIComponent(eventTransaction.id)}`, {
      headers: { Authorization: `Bearer ${privateKey}`, Accept: 'application/json' }, signal: controller.signal,
    });
    if (!response.ok) throw new Error('WOMPI_UNAVAILABLE');
    const canonical = (await response.json() as any)?.data;
    if (!canonical || canonical.id !== eventTransaction.id || canonical.reference !== eventTransaction.reference ||
        canonical.amount_in_cents !== eventTransaction.amount_in_cents || canonical.currency !== eventTransaction.currency) return null;
    return { transaction: canonical };
  } finally { clearTimeout(timeout); }
}

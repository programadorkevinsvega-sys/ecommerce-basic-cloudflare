/**
 * Resuelve una ruta con notación de punto (ej: "transaction.id") desde un objeto raíz
 */
export function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((cur: unknown, key: string) =>
    cur && typeof cur === 'object' ? (cur as Record<string, unknown>)[key] : undefined
  , obj);
}

/**
 * Verifica la firma criptográfica enviada por Wompi en sus webhooks.
 * Wompi concatena los valores de signature.properties (relativos a body.data) + timestamp + eventsSecret.
 */
export async function verifyWompiSignature(
  body: any,
  eventsSecret: string
): Promise<boolean> {
  const checksum = body?.signature?.checksum as string | undefined;
  const timestamp = body?.timestamp as number | undefined;
  const properties = body?.signature?.properties as string[] | undefined;

  if (typeof checksum !== 'string' || !/^[a-f0-9]{64}$/i.test(checksum) ||
      !Number.isSafeInteger(timestamp) || !Array.isArray(properties) || properties.length === 0 ||
      properties.some((p) => typeof p !== 'string' || p.length > 128)) {
    return false;
  }
  const age = Math.floor(Date.now() / 1000) - timestamp!;
  if (age < -300 || age > 25 * 60 * 60) return false;

  const dataObj = (body?.data ?? {}) as Record<string, unknown>;
  const propValues = properties
    .map((p: string) => String(resolvePath(dataObj, p) ?? ''))
    .join('');
  const raw = `${propValues}${timestamp}${eventsSecret}`;

  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const calculated = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const expected = new TextEncoder().encode(calculated.toLowerCase());
  const supplied = new TextEncoder().encode(checksum.toLowerCase());
  let mismatch = expected.length ^ supplied.length;
  for (let i = 0; i < expected.length; i++) mismatch |= (expected[i] ?? 0) ^ (supplied[i] ?? 0);
  return mismatch === 0;
}

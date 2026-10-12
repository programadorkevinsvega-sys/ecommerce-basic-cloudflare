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

  if (!checksum || !timestamp || !Array.isArray(properties)) {
    return false;
  }

  const dataObj = (body?.data ?? {}) as Record<string, unknown>;
  const propValues = properties
    .map((p: string) => String(resolvePath(dataObj, p) ?? ''))
    .join('');
  const raw = `${propValues}${timestamp}${eventsSecret}`;

  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const calculated = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return calculated.toLowerCase() === checksum.toLowerCase();
}

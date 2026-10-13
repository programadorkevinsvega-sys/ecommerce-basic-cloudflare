const RESERVED_SLUGS = new Set([
  'admin', 'api', 'auth', 'login', 'logout', 'carrito', 'cart',
  'checkout', 'productos', 'media', 'health', 'settings', 'cuenta', 'account'
]);

export function validateAndFormatSlug(raw: string): string {
  if (!raw || typeof raw !== 'string') {
    throw new Error('El slug es requerido');
  }

  const formatted = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!formatted) {
    throw new Error('El slug no es válido. Debe contener al menos una letra o número.');
  }

  if (RESERVED_SLUGS.has(formatted)) {
    throw new Error(`El slug '${formatted}' está reservado por el sistema.`);
  }

  return formatted;
}

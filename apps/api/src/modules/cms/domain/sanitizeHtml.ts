/**
 * Sanitizador de HTML en el servidor para evitar ataques XSS
 * Conforme a SEC-SAN-01: No permitir scripts, event handlers ni esquemas javascript:
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';
  return dirty
    .replace(/<\s*(script|style|iframe|object|embed|applet|form|base|meta|link)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|object|embed|applet|form|base|meta|link)[^>]*>/gi, '')
    .replace(/\s+on[a-zA-Z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/href\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*'|[^\s>]*javascript:[^\s>]*)/gi, 'href="#"')
    .replace(/src\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*'|[^\s>]*javascript:[^\s>]*)/gi, 'src=""')
    .trim();
}

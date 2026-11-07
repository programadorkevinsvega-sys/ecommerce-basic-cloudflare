import { sanitizeHtml } from './sanitizeHtml.js';

export function sanitizeBlogHtml(input: string): string {
  return sanitizeHtml(input);
}

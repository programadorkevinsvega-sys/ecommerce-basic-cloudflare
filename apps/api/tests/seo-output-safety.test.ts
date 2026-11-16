import { describe, expect, it } from 'vitest';
import { Redirect } from '../src/modules/seo/domain/entities/Redirect.js';
import { StructuredDataHelper } from '../src/modules/catalog/domain/services/StructuredDataHelper.js';

describe('SEO output safety', () => {
  it('escapes HTML-significant characters and JavaScript line separators in JSON-LD', () => {
    const json = StructuredDataHelper.generateWebSiteSchema(
      'https://store.example.test', '</script>&\u2028\u2029',
    );
    expect(json).toContain('\\u003c/script\\u003e\\u0026\\u2028\\u2029');
    expect(JSON.parse(json).name).toBe('</script>&\u2028\u2029');
  });

  it('accepts same-origin relative redirect paths and rejects external destinations', () => {
    const base = {
      id: 'redirect-1', fromPath: '/old', statusCode: 301,
      createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    };
    expect(() => new Redirect({ ...base, toPath: '/new?source=old' })).not.toThrow();
    for (const toPath of ['https://evil.example', '//evil.example/path', '/\\evil.example/path']) {
      expect(() => new Redirect({ ...base, toPath })).toThrow();
    }
  });
});

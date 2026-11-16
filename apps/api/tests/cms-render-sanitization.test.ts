import { describe, expect, it } from 'vitest';
import { renderCmsBlocks } from '../src/bff/views/renderCmsBlocks.js';
import { sanitizeHtml } from '../src/modules/cms/domain/sanitizeHtml.js';

describe('CMS rendering sanitization', () => {
  it('sanitizes stored rich HTML again before inserting it into storefront markup', () => {
    const html = '</script><script>alert(1)</script><img src=x onerror=alert(1)>';
    const rendered = renderCmsBlocks([{
      id: 'block-1', type: 'rich_text', sortOrder: 0, content: { html },
    }], sanitizeHtml);

    expect(rendered).not.toContain('<script');
    expect(rendered).not.toContain('onerror');
    expect(rendered).toContain('cms-rich-text');
  });
});

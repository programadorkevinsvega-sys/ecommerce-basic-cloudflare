import { describe, expect, it } from 'vitest';
import { renderAdminDashboardScript } from '../src/bff/views/admin/renderAdminDashboardScript.js';
import { renderBlogAdminScript } from '../src/bff/views/admin/renderBlogAdminScript.js';
import { renderBlogDashboardCss } from '../src/bff/views/admin/renderBlogDashboardCss.js';

describe('Blog admin presentation and actions', () => {
  it('uses the same light admin surface as the CMS management page', () => {
    expect(renderAdminDashboardScript()).toContain("classList.toggle('blog-mode', tabId === 'blog')");
    expect(renderBlogDashboardCss()).toContain('.admin-legacy-pane.blog-mode .blog-toolbar label');
    expect(renderBlogDashboardCss()).toContain('background:#151a23');
  });

  it('opens the new article dialog without waiting for taxonomy requests', () => {
    const script = renderBlogAdminScript();
    const action = script.slice(script.indexOf('window.blogNewPost=()=>'));
    expect(action.indexOf(".showModal()")).toBeLessThan(action.indexOf('blogLoadTaxonomies().catch'));
  });

  it('renders syntactically valid JavaScript for the admin controls', () => {
    const script = renderBlogAdminScript();
    expect(() => new Function(script)).not.toThrow();
  });
});

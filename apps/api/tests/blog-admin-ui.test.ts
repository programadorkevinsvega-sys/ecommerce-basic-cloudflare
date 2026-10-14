import { describe, expect, it } from 'vitest';
import { renderAdminDashboardScript } from '../src/bff/views/admin/renderAdminDashboardScript.js';
import { renderBlogAdminScript } from '../src/bff/views/admin/renderBlogAdminScript.js';
import { renderBlogDashboardCss } from '../src/bff/views/admin/renderBlogDashboardCss.js';

describe('Blog admin presentation and actions', () => {
  it('uses the same light admin surface as the CMS management page', () => {
    expect(renderAdminDashboardScript()).toContain("classList.toggle('blog-mode', tabId === 'blog')");
    expect(renderBlogDashboardCss()).toContain('.admin-legacy-pane.blog-mode .blog-toolbar label');
    expect(renderBlogDashboardCss()).toContain('background:#20563d');
  });

  it('renders row actions in a wrapping group with consistent button sizing', () => {
    expect(renderBlogAdminScript()).toContain('class=\"blog-row-actions\"');
    expect(renderBlogDashboardCss()).toContain('.blog-row-actions{display:flex;flex-wrap:wrap');
    expect(renderBlogDashboardCss()).toContain('min-width:64px;min-height:34px');
  });
  it('includes view, edit and delete actions for taxonomies and delete for every article status',()=>{
    const script=renderBlogAdminScript();
    expect(script).toContain('blogViewTaxonomy');expect(script).toContain('blogEditAuthor');expect(script).toContain('blogEditCategory');
    expect(script).toContain('blogDeleteTaxonomy');expect(script).toContain('blogDeletePost');
    expect(script).toContain("method:'DELETE'");
  });
  it('styles taxonomy tables and actions with the unified admin presentation',()=>{
    const css=renderBlogDashboardCss();
    expect(css).toContain('.blog-taxonomy-table');expect(css).toContain('.blog-row-action-delete');expect(css).toContain('.blog-view-content');
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

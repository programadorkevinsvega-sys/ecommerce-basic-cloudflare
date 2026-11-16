import { describe, expect, it } from 'vitest';
import { renderCmsPageRows } from '../src/bff/views/admin/renderCmsPageRows.js';
import { renderStorefrontAnnouncementRows } from '../src/bff/views/admin/renderStorefrontAnnouncementRows.js';
import { renderStorefrontBannerRows } from '../src/bff/views/admin/renderStorefrontBannerRows.js';
import { renderCmsFormsScript } from '../src/bff/views/admin/renderCmsFormsScript.js';
import { renderStorefrontActionsScript } from '../src/bff/views/admin/renderStorefrontActionsScript.js';
import { renderCmsManagementSection } from '../src/bff/views/admin/renderCmsManagementSection.js';
import { renderStorefrontManagementSection } from '../src/bff/views/admin/renderStorefrontManagementSection.js';

const payload = `x&#39;);window.__pwned=1;//" </script>`;

describe('admin row action XSS regression', () => {
  it('keeps hostile CMS values in escaped data attributes and delegates row actions', () => {
    const page = {
      id: payload, title: payload, slug: payload, status: 'draft', currentVersion: 1,
      blocks: [{ id: 'block', type: 'rich_text', content: { html: payload }, sortOrder: 0 }],
      seoTitle: payload, seoDescription: payload, createdAt: '', updatedAt: '2026-01-01',
    };
    const rows = renderCmsPageRows([page]);
    expect(rows).toContain('data-cms-action="edit"');
    expect(rows).toContain('data-cms-id="x&amp;#39;');
    expect(rows).toContain('data-cms-title="x&amp;#39;);window.__pwned=1;//&quot; &lt;/script&gt;"');
    expect(rows).toContain('data-cms-slug="x&amp;#39;');
    expect(rows).toContain('data-cms-seo-title="x&amp;#39;');
    expect(rows).toContain('data-cms-seo-description="x&amp;#39;');
    expect(rows).toContain('data-cms-body="x&amp;#39;');
    expect(rows).not.toContain('onclick=');
    expect(renderCmsManagementSection([page])).not.toContain('onclick="editCmsPage');
    expect(renderCmsFormsScript()).toContain("closest('[data-cms-action]')");
  });

  it('keeps hostile banner and announcement values out of executable attributes', () => {
    const banner = {
      id: 'banner-id', title: payload, description: payload, bannerType: 'promotional' as const,
      buttonText: payload, placement: payload, imageUrl: payload, linkUrl: payload,
      altText: payload, isActive: true, startsAt: payload, endsAt: payload, sortOrder: 1,
    };
    const announcement = { id: 'announcement-id', message: payload, placement: payload, linkUrl: payload, isActive: true };
    const bannerRows = renderStorefrontBannerRows([banner], true);
    const announcementRows = renderStorefrontAnnouncementRows([announcement]);
    expect(bannerRows).toContain('data-storefront-action="edit-banner"');
    expect(announcementRows).toContain('data-storefront-action="edit-announcement"');
    for (const field of ['title', 'link', 'alt', 'image', 'placement', 'description', 'button-text', 'starts-at', 'ends-at']) {
      expect(bannerRows).toContain(`data-${field}="x&amp;#39;`);
    }
    for (const field of ['message', 'link', 'placement']) {
      expect(announcementRows).toContain(`data-${field}="x&amp;#39;`);
    }
    expect(bannerRows + announcementRows).not.toContain('onclick="edit');

    const initialMarkup = renderStorefrontManagementSection([banner], [announcement]);
    expect(initialMarkup).not.toContain('onclick="editBanner');
    expect(initialMarkup).not.toContain('onclick="editAnnouncement');
    expect(initialMarkup).toContain('data-title="x&amp;#39;');
    expect(initialMarkup).toContain('data-message="x&amp;#39;');
    expect(bannerRows + announcementRows).not.toContain('onclick="edit');
    expect(renderStorefrontActionsScript()).toContain("closest('[data-storefront-action]')");
  });
});

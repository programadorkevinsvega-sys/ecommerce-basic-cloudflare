import { describe, expect, it } from 'vitest';
import { renderOrderTrackingAdminSection } from '../src/bff/views/admin/renderOrderTrackingAdminSection.js';
import { renderOrderTrackingAdminScript } from '../src/bff/views/admin/renderOrderTrackingAdminScript.js';
import { renderOrderTrackingAdminCss } from '../src/bff/views/admin/renderOrderTrackingAdminCss.js';

describe('order tracking admin interface', () => {
  it('renders tracking workflow controls and valid client script', () => {
    const section = renderOrderTrackingAdminSection();
    expect(section).toContain('data-shipping-panel="tracking"');
    expect(section).toContain('tracking-edit-timeline');
    expect(section).toContain('tracking-edit-url');
    expect(renderOrderTrackingAdminCss()).toContain('width:min(980px,calc(100vw - 40px))');
    expect(renderOrderTrackingAdminCss()).toContain('background:#fff!important; color:#151a23!important');
    expect(() => new Function(renderOrderTrackingAdminScript())).not.toThrow();
  });
});

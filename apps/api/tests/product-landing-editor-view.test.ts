import { describe, expect, it } from 'vitest';
import { renderProductLandingEditorCard } from '../src/bff/views/admin/renderProductLandingEditorCard.js';
import { renderProductLandingEditorCss } from '../src/bff/views/admin/renderProductLandingEditorCss.js';
import { renderProductLandingEditorScript } from '../src/bff/views/admin/renderProductLandingEditorScript.js';

describe('editor administrativo de landing de producto', () => {
  it('renderiza los campos configurables y las secciones permitidas', () => {
    const markup = renderProductLandingEditorCard();
    expect(markup).toContain('id="productLandingForm"');
    expect(markup).toContain('id="plHeadline"');
    expect(markup).toContain('id="plSeoTitle"');
    expect(markup).toContain('value="conversion"');
    expect(markup).toContain('value="launch"');
    expect(markup).toContain('value="benefits"');
    expect(markup).toContain('value="reviews"');
    expect(markup).toContain('data-close-product-landing');
  });

  it('guarda mediante el endpoint administrativo existente y no inserta HTML dinámico', () => {
    const script = renderProductLandingEditorScript();
    expect(script).toContain("method: 'PUT'");
    expect(script).toContain("'/landing'");
    expect(script).toContain('JSON.stringify(payload)');
    expect(script).toContain('decodeRows');
    expect(script).toContain('seoDescription: field');
    expect(script).not.toContain('insertAdjacentHTML');
    expect(renderProductLandingEditorCss()).toContain('.landing-modal[hidden]');
  });
});

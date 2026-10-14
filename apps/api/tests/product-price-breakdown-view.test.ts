import { describe, expect, it } from 'vitest';
import { renderProductFormCard } from '../src/bff/views/admin/renderProductFormCard.js';
import { renderProductPricingScript } from '../src/bff/views/admin/renderProductPricingScript.js';

describe('desglose del precio recomendado en administración', () => {
  it('distingue el precio bruto, el IVA, el costo, la ganancia y el margen', () => {
    const markup = renderProductFormCard();
    const script = renderProductPricingScript();
    expect(markup).toContain('Precio bruto recomendado del producto');
    expect(script).toContain('Precio bruto del producto (IVA incluido)');
    expect(script).toContain('IVA incluido estimado');
    expect(script).toContain('Costo del proveedor');
    expect(script).toContain('Ganancia neta estimada');
    expect(script).toContain('Margen real sobre venta sin IVA');
    expect(script).toContain('netFeeCost');
  });

  it('muestra un error para 99,99% con Wompi sin entrar en un cálculo infinito', () => {
    const elements = new Map<string, { value: string; checked?: boolean; textContent?: string; innerHTML?: string; addEventListener?: () => void }>();
    const element = (id: string) => {
      if (!elements.has(id)) elements.set(id, { value: '', addEventListener: () => undefined });
      return elements.get(id)!;
    };
    element('pCost').value = '60.000';
    element('pMargin').value = '99.99';
    element('pPayWompi').checked = true;
    element('productTaxRate').value = '19';
    const target = element('pPrice');
    const windowStub = {
      currentProductMediaIds: [],
      setCopInputValue: (_id: string, value: string) => { target.value = value; },
      copPesosToCents: () => 6_000_000,
    };
    const documentStub = {
      getElementById: (id: string) => element(id),
    };
    new Function('window', 'document', renderProductPricingScript())(windowStub, documentStub);
    (windowStub as unknown as { updateRecommendedProductPrice: () => void }).updateRecommendedProductPrice();

    expect(target.value).toBe('');
    expect(element('pPriceBreakdown').textContent).toContain('no se puede alcanzar con Wompi');
    expect(element('pPriceBreakdown').textContent).toContain('94,21%');
  });
});

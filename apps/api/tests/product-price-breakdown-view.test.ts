import { describe, expect, it } from 'vitest';
import { renderProductFormCard } from '../src/bff/views/admin/renderProductFormCard.js';
import { renderProductFormsScript } from '../src/bff/views/admin/renderProductFormsScript.js';

describe('desglose del precio recomendado en administración', () => {
  it('distingue el precio bruto, el IVA, el costo, la ganancia y el margen', () => {
    const markup = renderProductFormCard();
    const script = renderProductFormsScript();
    expect(markup).toContain('Precio bruto recomendado del producto');
    expect(script).toContain('Precio bruto del producto (IVA incluido)');
    expect(script).toContain('IVA incluido estimado');
    expect(script).toContain('Costo del proveedor');
    expect(script).toContain('Ganancia neta estimada');
    expect(script).toContain('Margen real sobre venta sin IVA');
    expect(script).toContain('netFeeCost');
  });
});

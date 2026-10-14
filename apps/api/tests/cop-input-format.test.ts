import { describe, expect, it } from 'vitest';
import { renderCopInputScript } from '../src/bff/views/admin/renderCopInputScript.js';

interface CopWindow {
  setCopInputMode(id: string, enabled: boolean): void;
  readCopPesos(id: string): number;
  copPesosToCents(id: string): number;
}

function createCopInput(value: string) {
  const input = {
    id: 'amount', value, dataset: {} as Record<string, string>, selectionStart: value.length,
    validityMessage: '', listeners: {} as Record<'input' | 'blur', () => void>,
    addEventListener(name: 'input' | 'blur', listener: () => void) { this.listeners[name] = listener; },
    setSelectionRange(start: number) { this.selectionStart = start; },
    setCustomValidity(message: string) { this.validityMessage = message; },
  };
  const window = {} as CopWindow;
  const document = {
    getElementById(id: string) { return id === input.id ? input : null; },
    querySelectorAll() { return []; },
  };
  const execute = new Function('window', 'document', renderCopInputScript());
  execute(window, document);
  return { input, window };
}

describe('formato de importes COP en el panel', () => {
  it('mantiene vacío el costo hasta que el administrador escriba un monto', () => {
    const { input, window } = createCopInput('');
    window.setCopInputMode('amount', true);
    expect(input.value).toBe('');
    expect(Number.isNaN(window.readCopPesos('amount'))).toBe(true);
  });

  it('agrupa miles al escribir y convierte pesos a la unidad interna sin pedir centavos', () => {
    const { input, window } = createCopInput('140000');
    window.setCopInputMode('amount', true);
    input.listeners.input?.();
    expect(input.value).toBe('140.000');
    expect(window.readCopPesos('amount')).toBe(140000);
    expect(window.copPesosToCents('amount')).toBe(14000000);
  });

  it('acepta pegar 140,000.00 como pesos colombianos completos', () => {
    const { input, window } = createCopInput('140,000.00');
    window.setCopInputMode('amount', true);
    input.listeners.input?.();
    expect(input.value).toBe('140.000');
    expect(window.readCopPesos('amount')).toBe(140000);
  });

  it('no interpreta decimales distintos de cero como otro monto válido', () => {
    const { input, window } = createCopInput('140,000.50');
    window.setCopInputMode('amount', true);
    input.listeners.input?.();
    expect(Number.isNaN(window.readCopPesos('amount'))).toBe(true);
    expect(input.validityMessage).toContain('sin centavos');
  });
});

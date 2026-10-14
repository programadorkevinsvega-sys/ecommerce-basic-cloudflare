export function renderCopInputScript(): string {
  return `
    const copInputFormatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
    function parseWholeCopPesos(value) {
      const raw = String(value || '').trim().replace(/[$\\s]/g, '');
      if (!raw) return null;
      if (!/^[0-9.,]+$/.test(raw)) return null;
      const dot = raw.lastIndexOf('.'), comma = raw.lastIndexOf(',');
      const separator = Math.max(dot, comma);
      const hasBoth = dot >= 0 && comma >= 0;
      const fractionLength = separator < 0 ? 0 : raw.length - separator - 1;
      const decimalSeparator = hasBoth || (separator >= 0 && fractionLength > 0 && fractionLength < 3);
      if (decimalSeparator) {
        const fraction = raw.slice(separator + 1);
        if (fraction && !/^0+$/.test(fraction)) return null;
      }
      const integerText = decimalSeparator ? raw.slice(0, separator) : raw;
      const digits = integerText.replace(/\\D/g, '').slice(0, 15);
      if (!digits) return 0;
      const amount = Number(digits);
      return Number.isSafeInteger(amount) ? amount : null;
    }
    function formatCopDigits(value) {
      const amount = parseWholeCopPesos(value);
      return amount === null ? null : copInputFormatter.format(amount);
    }
    function formatCopInput(input) {
      if (input.dataset.copMode !== 'true') return;
      if (!input.value.trim()) {
        input.setCustomValidity('');
        return;
      }
      const cursor = input.selectionStart ?? input.value.length;
      const digitCount = input.value.slice(0, cursor).replace(/\\D/g, '').length;
      const formatted = formatCopDigits(input.value);
      if (formatted === null) {
        input.setCustomValidity('Ingresa pesos completos, sin centavos. Puedes pegar valores como 140,000.00.');
        return;
      }
      input.setCustomValidity('');
      input.value = formatted;
      let nextCursor = 0, seen = 0;
      while (nextCursor < input.value.length && seen < digitCount) {
        if (/\\d/.test(input.value[nextCursor])) seen++;
        nextCursor++;
      }
      input.setSelectionRange(nextCursor, nextCursor);
    }
    window.setCopInputMode = function(id, enabled) {
      const input = document.getElementById(id);
      if (!input) return;
      input.dataset.copMode = enabled ? 'true' : 'false';
      if (!input.dataset.copListeners) {
        input.addEventListener('input', () => formatCopInput(input));
        input.addEventListener('blur', () => formatCopInput(input));
        input.dataset.copListeners = 'true';
      }
      if (enabled) formatCopInput(input);
      else input.setCustomValidity('');
    };
    window.readCopPesos = function(id) {
      const amount = parseWholeCopPesos(document.getElementById(id)?.value);
      return amount === null ? NaN : amount;
    };
    window.copPesosToCents = function(id) {
      const pesos = window.readCopPesos(id);
      const cents = pesos * 100;
      return Number.isSafeInteger(cents) ? cents : NaN;
    };
    window.setCopInputValue = function(id, pesos) {
      const input = document.getElementById(id);
      if (!input) return;
      if (pesos === '' || pesos === null || pesos === undefined) input.value = '';
      else input.value = copInputFormatter.format(Math.max(0, Number(pesos) || 0));
      input.setCustomValidity('');
    };
    document.querySelectorAll('[data-cop-input]').forEach((input) => {
      const selectorId = input.dataset.copTypeSelect;
      const selector = selectorId ? document.getElementById(selectorId) : null;
      window.setCopInputMode(input.id, !selector || selector.value === 'fixed_amount');
      selector?.addEventListener('change', () => window.setCopInputMode(input.id, selector.value === 'fixed_amount'));
    });
  `;
}

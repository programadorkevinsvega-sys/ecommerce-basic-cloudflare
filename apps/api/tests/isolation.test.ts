import { describe, it, expect } from 'vitest';
import { checkTableIsolation } from '../scripts/check-table-isolation.js';

describe('Aislamiento estricto de tablas D1 entre módulos (ADR-0001)', () => {
  it('ningún módulo debe referenciar tablas de otro prefijo en su SQL o código', () => {
    const result = checkTableIsolation();
    expect(result.violations).toEqual([]);
    expect(result.passed).toBe(true);
  });
});

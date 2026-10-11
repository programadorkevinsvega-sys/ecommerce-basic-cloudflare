import { describe, it, expect } from 'vitest';
import { checkArchitecture } from '../scripts/check-architecture.js';

describe('Cumplimiento del contrato de arquitectura (ARQUITECTURA_RULES)', () => {
  it('debe cumplir con 200 líneas, capas limpias, sin imports entre módulos ni utils.ts', () => {
    const result = checkArchitecture();
    expect(result.violations).toEqual([]);
    expect(result.passed).toBe(true);
  });
});

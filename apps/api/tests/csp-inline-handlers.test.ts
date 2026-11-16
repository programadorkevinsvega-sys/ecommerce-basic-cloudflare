import { describe, expect, it } from 'vitest';

declare global {
  interface ImportMeta {
    glob<T>(pattern: string, options: { eager: true; query: '?raw'; import: 'default' }): Record<string, T>;
  }
}

const viewSources = import.meta.glob<string>('../src/bff/views/**/*.ts', {
  eager: true,
  query: '?raw',
  import: 'default',
});
const inlineHandler = /\bon(?:click|input|change|submit|error|load|keyup|keydown|focus|blur|pointerenter|pointerleave)\s*=/i;

describe('CSP inline handler policy', () => {
  it('keeps executable event attributes out of every server-rendered view', async () => {
    const matches = Object.entries(viewSources)
      .filter(([, source]) => inlineHandler.test(source))
      .map(([path]) => path);

    expect(matches).toEqual([]);
  });
});

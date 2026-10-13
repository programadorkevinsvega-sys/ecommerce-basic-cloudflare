import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';
import fs from 'node:fs';
import path from 'node:path';

const migrationsPath = path.resolve('migrations');
const migrations = fs.readdirSync(migrationsPath).filter((name) => name.endsWith('.sql')).sort((a, b) => {
  const left = a.match(/^([a-z]+)__([0-9]+)_(.+)\.sql$/)!;
  const right = b.match(/^([a-z]+)__([0-9]+)_(.+)\.sql$/)!;
  return left[1].localeCompare(right[1]) || Number(left[2]) - Number(right[2]);
}).map((name) => ({ name, sql: fs.readFileSync(path.join(migrationsPath, name), 'utf8') }));

export default defineConfig({
  plugins: [cloudflareTest({
    main: 'src/index.ts', wrangler: { configPath: './wrangler.jsonc' },
    miniflare: { bindings: { TEST_MIGRATIONS: migrations, WOMPI_EVENTS_SECRET: 'local-test-events-secret', WOMPI_PRIVATE_KEY: 'prv_test_local-only', WOMPI_ENVIRONMENT: 'sandbox' } },
  })],
  test: { include: ['tests/workers/**/*.test.ts'] },
});

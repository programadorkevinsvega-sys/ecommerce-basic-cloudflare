import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootDir = path.resolve(apiDir, '../..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ecommerce-d1-empty-'));
const persist = path.join(temporary, 'state');
const config = path.join(temporary, 'wrangler.jsonc');
const database = `ecommerce-empty-test-${process.pid}`;
const wrangler = path.join(rootDir, 'node_modules/.bin/wrangler');
fs.writeFileSync(config, JSON.stringify({ name: 'migration-test', main: path.join(apiDir, 'src/index.ts'), compatibility_date: '2026-10-12', d1_databases: [{ binding: 'DB', database_name: database, database_id: '00000000-0000-0000-0000-000000000001', migrations_dir: path.join(apiDir, 'migrations') }] }));
const env = { ...process.env, ECOMMERCE_WRANGLER_CONFIG: config, ECOMMERCE_D1_DATABASE: database, ECOMMERCE_D1_PERSIST_TO: persist, WRANGLER_LOG_PATH: path.join(temporary, 'logs') };
const apply = () => execFileSync(process.execPath, [path.join(apiDir, 'scripts/apply-migrations.js'), '--local'], { cwd: apiDir, env, stdio: 'inherit' });
const query = (sql) => JSON.parse(execFileSync(wrangler, ['d1', 'execute', database, '--config', config, '--local', '--persist-to', persist, '--json', '--command', sql], { cwd: apiDir, env, encoding: 'utf8' }))[0].results;

try {
  apply();
  apply();
  const names = query('SELECT name FROM d1_migrations ORDER BY rowid').map((row) => row.name);
  const expected = fs.readdirSync(path.join(apiDir, 'migrations')).filter((name) => name.endsWith('.sql')).length;
  const count = names.length;
  const settings = query("SELECT name FROM pragma_table_info('settings_store')").map((row) => row.name);
  const v1 = names.indexOf('settings__0001_init.sql');
  const v2 = names.indexOf('settings__0002_company_tax_fields.sql');
  const inventoryTable = query("SELECT name FROM sqlite_master WHERE type='table' AND name='inventory_order_consumptions'");
  if (count !== expected || v1 < 0 || v2 <= v1 || !settings.includes('company_nit') || inventoryTable.length !== 1) {
    throw new Error(`Resultado inesperado: ${count}/${expected} migraciones; settings_store=${settings.join(',')}`);
  }
  console.log(`Migraciones D1 en blanco correctas e idempotentes: ${count}; settings v1 precedió v2.`);
} finally { fs.rmSync(temporary, { recursive: true, force: true }); }

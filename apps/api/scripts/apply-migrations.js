import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootDir = path.resolve(apiDir, '../..');
const mode = process.argv[2];
if (!['--local', '--remote'].includes(mode)) throw new Error('Uso: node scripts/apply-migrations.js --local|--remote');
if (mode === '--remote' && process.env.ALLOW_REMOTE_D1_MIGRATIONS !== '1') {
  throw new Error('Para D1 remoto, define ALLOW_REMOTE_D1_MIGRATIONS=1 tras revisar backup, manifiesto y plan de aplicación.');
}

const config = process.env.ECOMMERCE_WRANGLER_CONFIG || path.join(apiDir, 'wrangler.jsonc');
const d1Name = process.env.ECOMMERCE_D1_DATABASE || 'ecommerce-vega-production';
const wrangler = path.join(rootDir, 'node_modules/.bin/wrangler');
const cli = ['d1', 'execute', d1Name, '--config', config, mode];
if (mode === '--local' && process.env.ECOMMERCE_D1_PERSIST_TO) cli.push('--persist-to', process.env.ECOMMERCE_D1_PERSIST_TO);
const run = (args) => execFileSync(wrangler, [...cli, ...args], { cwd: apiDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
const execute = (sql) => {
  const file = path.join(os.tmpdir(), `ecommerce-migration-${process.pid}.sql`);
  try { fs.writeFileSync(file, sql); run(['--file', file]); }
  finally { fs.rmSync(file, { force: true }); }
};
const parseResults = (raw) => {
  const output = JSON.parse(raw);
  const first = Array.isArray(output) ? output[0] : output;
  if (first?.success === false) throw new Error('Wrangler D1 devolvió una ejecución fallida');
  return first?.results ?? [];
};

execute('CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP);');
const applied = new Set(parseResults(run(['--json', '--command', 'SELECT name FROM d1_migrations'])).map((row) => row.name));
const migrationDir = path.join(apiDir, 'migrations');
const files = fs.readdirSync(migrationDir).filter((file) => file.endsWith('.sql')).sort((left, right) => {
  const a = left.match(/^([a-z]+)__([0-9]+)_(.+)\.sql$/);
  const b = right.match(/^([a-z]+)__([0-9]+)_(.+)\.sql$/);
  if (!a || !b) throw new Error(`Nombre de migración inválido: ${!a ? left : right}`);
  return a[1].localeCompare(b[1]) || Number(a[2]) - Number(b[2]) || a[3].localeCompare(b[3]);
});

for (const name of files) {
  if (applied.has(name)) continue;
  const source = fs.readFileSync(path.join(migrationDir, name), 'utf8');
  if (source.includes('INSERT INTO d1_migrations')) throw new Error(`La migración ${name} intenta modificar el ledger`);
  execute(`${source}\nINSERT INTO d1_migrations (name) VALUES ('${name}');`);
  console.log(`[D1 ${mode.slice(2)}] aplicada ${name}`);
}
console.log(`[D1 ${mode.slice(2)}] esquema al día (${files.length} migraciones conocidas)`);

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const apiDirectory = resolve(scriptDirectory, '..');
const sendEmail = process.argv.includes('--send-email');

const localEnvironment = parseEnv(readFileSync(resolve(apiDirectory, '../../.env'), 'utf8'));

const apiUrl = new URL(localEnvironment.FACTUS_API_URL || '');
const apiPath = apiUrl.pathname.replace(/\/+$/, '');
if (apiUrl.protocol !== 'https:' || apiUrl.hostname !== 'api-sandbox.factus.com.co' ||
    !['', '/v2'].includes(apiPath) || apiUrl.username || apiUrl.password ||
    apiUrl.search || apiUrl.hash) {
  throw new Error('Factus integration test blocked: FACTUS_API_URL must target the HTTPS sandbox host.');
}

const credentialNames = [
  'FACTUS_PRODUCTION_CLIENT_ID',
  'FACTUS_PRODUCTION_CLIENT_SECRET',
  'FACTUS_PRODUCTION_USERNAME',
  'FACTUS_PRODUCTION_PASSWORD',
];
if (credentialNames.some((name) => !localEnvironment[name])) {
  throw new Error('Factus integration test blocked: all four Factus OAuth credentials are required.');
}
if (sendEmail && !localEnvironment.FACTUS_SANDBOX_EMAIL_TO) {
  throw new Error('Factus email test blocked: set FACTUS_SANDBOX_EMAIL_TO to a test mailbox in .env.');
}

const vitestPath = resolve(apiDirectory, 'node_modules/vitest/vitest.mjs');
const result = spawnSync(process.execPath, [
  vitestPath,
  'run',
  '--silent=false',
  'tests/factus-sandbox.integration.test.ts',
], {
  cwd: apiDirectory,
  stdio: 'inherit',
  env: {
    ...process.env,
    ...Object.fromEntries(['FACTUS_API_URL', ...credentialNames].map((name) => [name, localEnvironment[name]])),
    FACTUS_SANDBOX_INTEGRATION_TEST: '1',
    FACTUS_SANDBOX_EMAIL_TEST: sendEmail ? '1' : '0',
    FACTUS_SANDBOX_EMAIL_TO: sendEmail ? localEnvironment.FACTUS_SANDBOX_EMAIL_TO : '',
  },
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;

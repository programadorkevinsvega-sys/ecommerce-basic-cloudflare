import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configs = ['wrangler.jsonc', 'apps/api/wrangler.jsonc'].map((file) => ({
  file,
  config: JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')),
}));
const required = ['AUTH_LIMITER', 'CHECKOUT_LIMITER', 'API_WRITE_LIMITER'];
const normalize = (entries = []) => Object.fromEntries(entries.map((entry) => [entry.name, entry]));
const expected = normalize(configs[0].config.ratelimits);
const actual = normalize(configs[1].config.ratelimits);
const errors = [];
const adminEmails = configs.map(({ config }) => config.vars?.ADMIN_EMAIL);
if (adminEmails.some(Boolean) && (!adminEmails[0] || adminEmails[0] !== adminEmails[1] || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmails[0]))) {
  errors.push('Si ADMIN_EMAIL se define en Wrangler, debe ser válido e idéntico en ambas configuraciones');
}
if (configs.some(({ config }) => config.vars?.ADMIN_PASSWORD !== undefined)) {
  errors.push('ADMIN_PASSWORD debe configurarse como secret y nunca en vars de Wrangler');
}

if (expectedImagesBinding(configs[0].config) !== 'IMAGES' || expectedImagesBinding(configs[1].config) !== 'IMAGES') {
  errors.push('El binding de Cloudflare Images debe declararse como IMAGES en ambas configuraciones Wrangler');
}

function expectedImagesBinding(config) {
  return config.images?.binding;
}

for (const name of required) {
  const binding = expected[name];
  if (!binding || !actual[name]) errors.push(`${name} falta en una configuración Wrangler`);
  else if (JSON.stringify(binding) !== JSON.stringify(actual[name])) errors.push(`${name} diverge entre configuraciones`);
  if (binding && (!/^\d+$/.test(binding.namespace_id) || binding.simple?.limit <= 0 || ![10, 60].includes(binding.simple?.period))) {
    errors.push(`${name} tiene namespace o límites inválidos`);
  }
}
const namespaces = required.map((name) => expected[name]?.namespace_id).filter(Boolean);
if (new Set(namespaces).size !== namespaces.length) errors.push('Los namespace_id deben ser únicos para separar contadores');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Bindings IMAGES y rate limits coinciden; secretos fuera de vars, ADMIN_EMAIL puede configurarse en Dashboard.');

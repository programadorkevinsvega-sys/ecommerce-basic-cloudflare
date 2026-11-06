import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stagingPath = path.join(root, 'apps/api/wrangler.staging.jsonc');
const productionPath = path.join(root, 'apps/api/wrangler.jsonc');
const staging = JSON.parse(fs.readFileSync(stagingPath, 'utf8'));
const production = JSON.parse(fs.readFileSync(productionPath, 'utf8'));
const errors = [];
const fail = (message) => errors.push(message);
const d1 = staging.d1_databases?.find((binding) => binding.binding === 'DB');
const r2 = staging.r2_buckets?.find((binding) => binding.binding === 'MEDIA_BUCKET');
const kv = staging.kv_namespaces?.find((binding) => binding.binding === 'CACHE');
const producer = staging.queues?.producers?.find((binding) => binding.binding === 'EVENTS_QUEUE');
const consumer = staging.queues?.consumers?.find((binding) => binding.queue === producer?.queue);
const prodD1 = production.d1_databases?.find((binding) => binding.binding === 'DB');
const prodR2 = production.r2_buckets?.find((binding) => binding.binding === 'MEDIA_BUCKET');
const prodKv = production.kv_namespaces?.find((binding) => binding.binding === 'CACHE');
const prodQueue = production.queues?.producers?.find((binding) => binding.binding === 'EVENTS_QUEUE');

if (staging.name !== 'ecommerce-basic-cloudflare-staging') fail('El Worker debe llamarse ecommerce-basic-cloudflare-staging');
if (staging.vars?.ENVIRONMENT !== 'staging') fail('ENVIRONMENT debe ser staging');
if (staging.workers_dev !== true || staging.routes?.length) fail('Staging debe usar workers.dev y no declarar rutas/dominio de producción');
if (!d1 || d1.database_name !== 'ecommerce-vega-staging') fail('Falta la D1 ecommerce-vega-staging');
if (!d1?.database_id || d1.database_id.includes('REPLACE_') || !/^[0-9a-f-]{36}$/i.test(d1.database_id)) fail('Configura el UUID real de la D1 de staging');
if (d1?.database_id === prodD1?.database_id || d1?.database_name === prodD1?.database_name) fail('La D1 de staging no puede coincidir con producción');
if (!r2 || r2.bucket_name !== 'ecommerce-vega-staging' || r2.bucket_name === prodR2?.bucket_name) fail('El bucket R2 debe ser ecommerce-vega-staging y distinto de producción');
if (!kv?.id || kv.id.includes('REPLACE_') || !/^[0-9a-f]{32}$/i.test(kv.id)) fail('Configura el ID real de Workers KV de staging');
if (kv?.id === prodKv?.id) fail('El namespace KV de staging no puede coincidir con producción');
if (!producer || producer.queue !== 'ecommerce-vega-events-staging' || producer.queue === prodQueue?.queue) fail('La Queue principal debe ser exclusiva de staging');
if (!consumer || consumer.dead_letter_queue !== 'ecommerce-vega-events-dlq-staging') fail('Configura una DLQ exclusiva de staging');
for (const name of ['AUTH_LIMITER', 'CHECKOUT_LIMITER', 'API_WRITE_LIMITER']) {
  const stagingLimit = staging.ratelimits?.find((entry) => entry.name === name);
  const productionLimit = production.ratelimits?.find((entry) => entry.name === name);
  if (!stagingLimit || stagingLimit.namespace_id === productionLimit?.namespace_id) fail(`Rate limit ${name} debe tener namespace_id propio`);
}
if (staging.vars?.WOMPI_ENVIRONMENT !== 'sandbox') fail('WOMPI_ENVIRONMENT debe ser sandbox');
if (staging.vars?.WOMPI_PUBLIC_KEY && !staging.vars.WOMPI_PUBLIC_KEY.startsWith('pub_test_')) fail('WOMPI_PUBLIC_KEY debe ser una llave pública de Wompi test (pub_test_).');
for (const key of ['WOMPI_PRIVATE_KEY', 'WOMPI_INTEGRITY_SECRET', 'WOMPI_EVENTS_SECRET', 'RESEND_API_KEY', 'MI_PAQUETE_TRANSPORTADORA', 'FACTUS_PRODUCTION_CLIENT_ID', 'FACTUS_PRODUCTION_CLIENT_SECRET', 'FACTUS_PRODUCTION_USERNAME', 'FACTUS_PRODUCTION_PASSWORD']) {
  if (staging.vars?.[key] !== undefined) fail(`${key} no puede estar en vars del repositorio; usa secrets exclusivos de staging o déjalo sin configurar`);
}
if (staging.vars?.FACTUS_API_URL || staging.vars?.MI_PAQUETE_API_URL) fail('No configures integraciones externas de producción en staging');
if (errors.length) {
  console.error('Configuración de staging bloqueada:\n- ' + errors.join('\n- '));
  console.error('Crea los recursos Cloudflare de staging y actualiza apps/api/wrangler.staging.jsonc antes de desplegar.');
  process.exit(1);
}
console.log('Staging aislado: Worker, D1, R2, KV, Queues/DLQ y rate limits son distintos de producción.');

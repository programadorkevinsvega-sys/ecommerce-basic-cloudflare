import { Env } from '../../../platform/Env.js';

export function isFactusCustomerEmailEnabled(env: Env): boolean {
  let production = false;
  try { production = new URL(env.FACTUS_API_URL || '').hostname === 'api.factus.com.co'; } catch { production = false; }
  return production && Boolean(env.FACTUS_PRODUCTION_CLIENT_ID &&
    env.FACTUS_PRODUCTION_CLIENT_SECRET && env.FACTUS_PRODUCTION_USERNAME && env.FACTUS_PRODUCTION_PASSWORD);
}

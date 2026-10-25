import { Env } from '../../../platform/Env.js';

export function isFactusCustomerEmailEnabled(env: Env, mode?: string): boolean {
  return mode === 'production' && Boolean(env.FACTUS_PRODUCTION_CLIENT_ID &&
    env.FACTUS_PRODUCTION_CLIENT_SECRET && env.FACTUS_PRODUCTION_USERNAME && env.FACTUS_PRODUCTION_PASSWORD);
}

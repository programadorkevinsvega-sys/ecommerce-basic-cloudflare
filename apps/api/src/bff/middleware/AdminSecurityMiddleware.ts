import { MiddlewareHandler } from 'hono';
import { Env } from '../../platform/Env.js';
import { IdentityGateway } from '../gateways/identity/IdentityGateway.js';
import { createAdminMfaGateMiddleware } from './AdminMfaGateMiddleware.js';
import { createAdminReauthenticationMiddleware } from './AdminReauthenticationMiddleware.js';
import { createAdminCountryAccessMiddleware } from './AdminCountryAccessMiddleware.js';

export function createAdminSecurityMiddleware(identity: IdentityGateway): MiddlewareHandler<{ Bindings: Env }> {
  const mfaGate = createAdminMfaGateMiddleware(identity);
  const reauthentication = createAdminReauthenticationMiddleware(identity);
  const countryAccess = createAdminCountryAccessMiddleware(identity);
  return async (c, next) => {
    return countryAccess(c, async () => {
      const continueToReauthentication = async () => { await reauthentication(c, next); };
      if (new URL(c.req.url).pathname.startsWith('/api/v1/admin/')) {
        await mfaGate(c, continueToReauthentication);
      } else {
        await reauthentication(c, next);
      }
    });
  };
}

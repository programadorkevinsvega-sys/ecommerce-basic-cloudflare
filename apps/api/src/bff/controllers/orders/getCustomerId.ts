import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';

export async function getCustomerId(token: string | undefined, identityGateway: IdentityGateway): Promise<string | null> {
  if (!token) return null;
  try {
    const session = await identityGateway.validateSession(token);
    return session?.actorType === 'customer' ? session.actorId : null;
  } catch { return null; }
}

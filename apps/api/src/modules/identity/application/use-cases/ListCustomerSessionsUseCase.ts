import { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';
import { SessionTokenGenerator } from '../../domain/services/SessionTokenGenerator.js';

export interface CustomerSessionView {
  id: string; createdAt: string; lastActiveAt: string; expiresAt: string; device: string; current: boolean;
}

export class ListCustomerSessionsUseCase {
  public constructor(private readonly sessions: ISessionRepository) {}

  public async execute(customerId: string, currentToken: string): Promise<CustomerSessionView[]> {
    const currentHash = await SessionTokenGenerator.hashToken(currentToken);
    const sessions = await this.sessions.listForActor(customerId);
    return sessions.map((session) => ({
      id: session.toSnapshot().id, createdAt: session.createdAt, lastActiveAt: session.lastActiveAt,
      expiresAt: session.expiresAt, device: (session.userAgent || 'Navegador desconocido').slice(0, 160),
      current: session.tokenHash === currentHash,
    }));
  }
}

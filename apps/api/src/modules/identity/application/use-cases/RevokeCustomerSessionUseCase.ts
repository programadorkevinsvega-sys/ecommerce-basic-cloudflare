import { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';

export class RevokeCustomerSessionUseCase {
  public constructor(private readonly sessions: ISessionRepository) {}

  public execute(sessionId: string, customerId: string): Promise<boolean> {
    return this.sessions.deleteOwnedSession(sessionId, customerId);
  }
}

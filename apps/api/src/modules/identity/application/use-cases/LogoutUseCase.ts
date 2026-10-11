import { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';
import { SessionTokenGenerator } from '../../domain/services/SessionTokenGenerator.js';

export class LogoutUseCase {
  private readonly sessionRepo: ISessionRepository;

  public constructor(sessionRepo: ISessionRepository) {
    this.sessionRepo = sessionRepo;
  }

  public async execute(rawToken: string): Promise<void> {
    const tokenHash = await SessionTokenGenerator.hashToken(rawToken);
    await this.sessionRepo.deleteByTokenHash(tokenHash);
  }
}

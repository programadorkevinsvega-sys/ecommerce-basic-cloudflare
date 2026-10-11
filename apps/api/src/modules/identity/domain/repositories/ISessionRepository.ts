import { Session } from '../entities/Session.js';

export interface ISessionRepository {
  findByTokenHash(tokenHash: string): Promise<Session | null>;
  save(session: Session): Promise<void>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
  deleteAllForActor(actorId: string): Promise<void>;
}

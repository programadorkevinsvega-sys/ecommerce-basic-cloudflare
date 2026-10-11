import { Redirect } from '../entities/Redirect.js';

export interface IRedirectRepository {
  findByFromPath(fromPath: string): Promise<Redirect | null>;
  save(redirect: Redirect): Promise<void>;
  list(limit: number, offset: number): Promise<Redirect[]>;
}

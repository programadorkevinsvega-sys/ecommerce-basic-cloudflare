import { Role } from '../entities/Role.js';

export interface IRoleRepository {
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  save(role: Role): Promise<void>;
  list(): Promise<Role[]>;
}

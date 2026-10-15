import { Menu } from '../entities/Menu.js';

export interface IMenuRepository {
  findByCode(code: string): Promise<Menu | null>;
  save(menu: Menu): Promise<void>;
}

import { Menu } from '../entities/Menu.js';

export interface IMenuRepository {
  findByCode(code: string): Promise<Menu | null>;
  save(menu: Menu): Promise<void>;
  addItem(item: {
    id: string;
    menuId: string;
    parentId?: string;
    title: string;
    url: string;
    sortOrder: number;
    target: string;
  }): Promise<void>;
}

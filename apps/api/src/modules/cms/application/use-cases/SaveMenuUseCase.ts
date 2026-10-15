import { Menu, MenuItemProps } from '../../domain/entities/Menu.js';
import { IMenuRepository } from '../../domain/ports/IMenuRepository.js';

export interface MenuItemInput {
  id?: string;
  title: string;
  type: 'link' | 'group';
  url?: string;
  target?: '_self' | '_blank';
  children?: MenuItemInput[];
}

export interface SaveMenuInput {
  code: 'header' | 'footer';
  title: string;
  items: MenuItemInput[];
}

export class SaveMenuUseCase {
  constructor(private readonly repository: IMenuRepository) {}

  public async execute(input: SaveMenuInput): Promise<Menu> {
    const existing = await this.repository.findByCode(input.code);
    const now = new Date().toISOString();
    const menuId = existing?.id || crypto.randomUUID();
    const count = { value: 0, ids: new Set<string>() };
    const items = input.items.map((item, index) => this.toItem(item, menuId, index, now, 0, count));
    if (count.value > 50) throw new Error('El menú admite hasta 50 enlaces y grupos');
    const menu = new Menu({
      id: menuId, code: input.code, title: input.title.trim(), items,
      createdAt: existing?.createdAt || now, updatedAt: now,
    });
    await this.repository.save(menu);
    return menu;
  }

  private toItem(input: MenuItemInput, menuId: string, sortOrder: number, now: string, depth: number, count: { value: number; ids: Set<string> }): MenuItemProps {
    count.value += 1;
    if (depth > 2 || count.value > 50) throw new Error('La jerarquía del menú supera el límite permitido');
    const title = input.title.trim();
    if (!title || title.length > 80) throw new Error('Cada enlace o grupo necesita un nombre de hasta 80 caracteres');
    const childrenInput = input.children || [];
    if (input.type === 'link' && childrenInput.length) throw new Error('Solo los grupos pueden contener elementos');
    const url = input.type === 'group' ? '' : validateMenuUrl(input.url || '');
    const id = input.id && /^[A-Za-z0-9_-]{1,64}$/.test(input.id) ? input.id : crypto.randomUUID();
    if (count.ids.has(id)) throw new Error('El menú contiene identificadores duplicados');
    count.ids.add(id);
    return {
      id, menuId, title, url, type: input.type, target: input.target === '_blank' ? '_blank' : '_self',
      sortOrder, createdAt: now,
      children: childrenInput.map((child, index) => this.toItem(child, menuId, index, now, depth + 1, count)),
    };
  }
}

function validateMenuUrl(value: string): string {
  const url = value.trim();
  if (!url || url.length > 500 || /[\u0000-\u001f\\]/.test(url)) throw new Error('Ingresa un enlace válido');
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') throw new Error('Solo se permiten enlaces HTTPS externos');
    return parsed.toString();
  } catch {
    throw new Error('Usa una ruta propia, como /productos, o un enlace HTTPS');
  }
}

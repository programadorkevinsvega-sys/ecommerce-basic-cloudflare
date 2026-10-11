export interface MenuItemProps {
  id: string;
  menuId: string;
  parentId?: string;
  title: string;
  url: string;
  sortOrder: number;
  target: string;
  createdAt: string;
  children?: MenuItemProps[];
}

export interface MenuProps {
  id: string;
  code: string;
  title: string;
  items: MenuItemProps[];
  createdAt: string;
  updatedAt: string;
}

export class Menu {
  private readonly props: MenuProps;

  public constructor(props: MenuProps) {
    if (!props.code || props.code.trim().length === 0) {
      throw new Error('El código del menú no puede estar vacío');
    }
    this.props = props;
  }

  public get id(): string { return this.props.id; }
  public get code(): string { return this.props.code; }
  public get title(): string { return this.props.title; }
  public get items(): MenuItemProps[] { return [...this.props.items]; }
  public get createdAt(): string { return this.props.createdAt; }
  public get updatedAt(): string { return this.props.updatedAt; }

  public toPrimitives(): MenuProps {
    return {
      ...this.props,
      items: [...this.props.items],
    };
  }
}

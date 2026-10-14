export interface CategoryProps {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  status?: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export class Category {
  private readonly props: CategoryProps;

  public constructor(props: CategoryProps) {
    this.props = { status: 'active', ...props };
  }

  public get id(): string { return this.props.id; }
  public get name(): string { return this.props.name; }
  public get slug(): string { return this.props.slug; }
  public get description(): string | undefined { return this.props.description; }
  public get parentId(): string | undefined { return this.props.parentId; }
  public get createdAt(): string { return this.props.createdAt; }
  public get updatedAt(): string { return this.props.updatedAt; }

  public toPrimitives(): CategoryProps {
    return { ...this.props };
  }
}

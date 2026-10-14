export interface BrandProps {
  id: string;
  name: string;
  slug: string;
  description?: string;
  websiteUrl?: string;
  imageMediaId?: string;
  status?: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export class Brand {
  private readonly props: BrandProps;

  public constructor(props: BrandProps) {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('El nombre de la marca no puede estar vacío');
    }
    if (!props.slug || props.slug.trim().length === 0) {
      throw new Error('El slug de la marca no puede estar vacío');
    }
    this.props = { status: 'active', ...props };
  }

  public get id(): string { return this.props.id; }
  public get name(): string { return this.props.name; }
  public get slug(): string { return this.props.slug; }
  public get description(): string | undefined { return this.props.description; }
  public get websiteUrl(): string | undefined { return this.props.websiteUrl; }
  public get createdAt(): string { return this.props.createdAt; }
  public get updatedAt(): string { return this.props.updatedAt; }

  public toPrimitives(): BrandProps {
    return { ...this.props };
  }
}

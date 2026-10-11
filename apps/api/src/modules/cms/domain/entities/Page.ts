export type PageStatus = 'draft' | 'published' | 'archived';

export interface CmsBlock {
  id: string;
  type: 'rich_text' | 'image' | 'gallery' | 'faq' | 'featured_products' | 'cta' | 'html';
  content: Record<string, unknown>;
  sortOrder: number;
}

export interface PageProps {
  id: string;
  title: string;
  slug: string;
  status: PageStatus;
  currentVersion: number;
  blocks: CmsBlock[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export class Page {
  private readonly props: PageProps;

  public constructor(props: PageProps) {
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('El título de la página no puede estar vacío');
    }
    if (!props.slug || props.slug.trim().length === 0) {
      throw new Error('El slug de la página no puede estar vacío');
    }
    this.props = props;
  }

  public get id(): string { return this.props.id; }
  public get title(): string { return this.props.title; }
  public get slug(): string { return this.props.slug; }
  public get status(): PageStatus { return this.props.status; }
  public get currentVersion(): number { return this.props.currentVersion; }
  public get blocks(): CmsBlock[] { return [...this.props.blocks]; }
  public get seoTitle(): string | undefined { return this.props.seoTitle; }
  public get seoDescription(): string | undefined { return this.props.seoDescription; }
  public get createdAt(): string { return this.props.createdAt; }
  public get updatedAt(): string { return this.props.updatedAt; }

  public updateContent(title: string, blocks: CmsBlock[], seoTitle?: string, seoDescription?: string): void {
    this.props.title = title.trim();
    this.props.blocks = [...blocks];
    this.props.seoTitle = seoTitle;
    this.props.seoDescription = seoDescription;
    this.props.currentVersion += 1;
    this.props.updatedAt = new Date().toISOString();
  }

  public publish(): void {
    this.props.status = 'published';
    this.props.updatedAt = new Date().toISOString();
  }

  public toPrimitives(): PageProps {
    return {
      ...this.props,
      blocks: [...this.props.blocks],
    };
  }
}

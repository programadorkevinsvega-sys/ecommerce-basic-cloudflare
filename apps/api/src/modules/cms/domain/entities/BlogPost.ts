export type BlogPostStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface BlogPostProps {
  id: string; title: string; slug: string; excerpt: string; contentHtml: string;
  authorId: string; authorName: string; authorBio: string; authorImageMediaId?: string;
  featuredImageMediaId?: string; featuredImageAlt: string; status: BlogPostStatus;
  scheduledAt?: string; publishedAt?: string; seoTitle: string; seoDescription: string;
  canonicalUrl?: string; noindex: boolean; categoryIds: string[]; categoryNames: string[];
  createdAt: string; updatedAt: string;
}

export class BlogPost {
  public constructor(private readonly props: BlogPostProps) {
    if (!props.title.trim() || !props.slug.trim() || !props.authorId) throw new Error('El artículo requiere título, URL y autor.');
    if (props.status === 'scheduled' && !props.scheduledAt) throw new Error('Define la fecha de publicación programada.');
  }
  public get id(): string { return this.props.id; }
  public get slug(): string { return this.props.slug; }
  public get status(): BlogPostStatus { return this.props.status; }
  public get scheduledAt(): string | undefined { return this.props.scheduledAt; }
  public toPrimitives(): BlogPostProps { return { ...this.props, categoryIds: [...this.props.categoryIds], categoryNames: [...this.props.categoryNames] }; }
}

import { BlogPost, BlogPostStatus } from '../../domain/entities/BlogPost.js';
import { IBlogRepository } from '../../domain/ports/IBlogRepository.js';
import { validateAndFormatSlug } from '../../domain/validateCmsSlug.js';
import { sanitizeBlogHtml } from '../../domain/sanitizeBlogHtml.js';

export interface SaveBlogPostInput {
  id?: string; title: string; slug: string; excerpt: string; contentHtml: string; authorId: string;
  featuredImageMediaId?: string; featuredImageAlt?: string; status: BlogPostStatus; scheduledAt?: string;
  seoTitle?: string; seoDescription?: string; canonicalUrl?: string; noindex?: boolean; categoryIds: string[];
}

export class SaveBlogPostUseCase {
  public constructor(private readonly repo: IBlogRepository) {}
  public async execute(input: SaveBlogPostInput): Promise<BlogPost> {
    const slug = validateAndFormatSlug(input.slug || input.title);
    const existing = input.id ? await this.repo.findPost(input.id) : null;
    if (input.id && !existing) throw new Error('Artículo no encontrado.');
    const collision = await this.repo.findPostBySlug(slug);
    if (collision && collision.id !== input.id) throw new Error('Ya existe un artículo con esa URL.');
    const contentHtml = sanitizeBlogHtml(input.contentHtml);
    if (!contentHtml.trim()) throw new Error('El contenido quedó vacío después de aplicar la sanitización.');
    if (contentHtml.length > 100_000) throw new Error('El artículo excede el límite de contenido.');
    if (input.canonicalUrl && !isSafeCanonical(input.canonicalUrl)) throw new Error('La URL canónica debe ser HTTPS.');
    const now = new Date().toISOString();
    const authorId = input.authorId.trim();
    if (!authorId) throw new Error('Selecciona un autor.');
    const article = new BlogPost({
      id: input.id || crypto.randomUUID(), title: input.title.trim(), slug, excerpt: input.excerpt.trim().slice(0, 500),
      contentHtml, authorId, authorName: '', authorBio: '', featuredImageMediaId: cleanOptional(input.featuredImageMediaId),
      featuredImageAlt: (input.featuredImageAlt || '').trim().slice(0, 250), status: input.status,
      scheduledAt: input.status === 'scheduled' ? validateFutureDate(input.scheduledAt) : undefined,
      publishedAt: input.status === 'published' ? (existing?.toPrimitives().publishedAt || now) : existing?.toPrimitives().publishedAt,
      seoTitle: (input.seoTitle || '').trim().slice(0, 80), seoDescription: (input.seoDescription || '').trim().slice(0, 200),
      canonicalUrl: cleanOptional(input.canonicalUrl), noindex: input.noindex === true, categoryIds: [...new Set(input.categoryIds)],
      categoryNames: [], createdAt: existing?.toPrimitives().createdAt || now, updatedAt: now,
    });
    await this.repo.savePost(article);
    const saved = await this.repo.findPost(article.id);
    if (!saved) throw new Error('No fue posible recuperar el artículo guardado.');
    return saved;
  }
}

function validateFutureDate(value?: string): string {
  const timestamp = Date.parse(value || '');
  if (!Number.isFinite(timestamp) || timestamp <= Date.now()) throw new Error('La fecha programada debe estar en el futuro.');
  return new Date(timestamp).toISOString();
}

function isSafeCanonical(value: string): boolean {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}

function cleanOptional(value?: string): string | undefined { return value?.trim() || undefined; }

import { Result } from '../../../../shared-kernel/Result.js';
import { Page, CmsBlock } from '../../domain/entities/Page.js';
import { IPageRepository } from '../../domain/ports/IPageRepository.js';
import { validateAndFormatSlug } from '../../domain/validateCmsSlug.js';
import { sanitizeHtml } from '../../domain/sanitizeHtml.js';

export interface UpdatePageContentInput {
  id: string;
  title: string;
  slug?: string;
  status?: 'draft' | 'published' | 'archived';
  blocks?: CmsBlock[];
  seoTitle?: string;
  seoDescription?: string;
  adminId?: string;
}

export class UpdatePageContentUseCase {
  private readonly pageRepo: IPageRepository;

  public constructor(pageRepo: IPageRepository) {
    this.pageRepo = pageRepo;
  }

  public async execute(input: UpdatePageContentInput): Promise<Result<Page, Error>> {
    const page = await this.pageRepo.findById(input.id);
    if (!page) {
      return Result.fail(new Error('Página no encontrada'));
    }

    try {
      if (input.slug && input.slug !== page.slug) {
        const validSlug = validateAndFormatSlug(input.slug);
        const existing = await this.pageRepo.findBySlug(validSlug);
        if (existing && existing.id !== page.id) {
          return Result.fail(new Error(`Ya existe una página con el slug '${validSlug}'`));
        }
        page.updateSlug(validSlug);
      }

      if (input.status) {
        page.setStatus(input.status);
      }

      let blocks = page.blocks;
      if (input.blocks) {
        blocks = input.blocks.map((b) => {
          const content = { ...b.content };
          if (typeof content['html'] === 'string') {
            content['html'] = sanitizeHtml(content['html']);
          }
          if (typeof content['text'] === 'string') {
            content['text'] = sanitizeHtml(content['text']);
          }
          return { ...b, content };
        });
      }

      page.updateContent(
        input.title || page.title,
        blocks,
        input.seoTitle !== undefined ? (input.seoTitle?.trim() || undefined) : page.seoTitle,
        input.seoDescription !== undefined ? (input.seoDescription?.trim() || undefined) : page.seoDescription
      );

      await this.pageRepo.save(page, input.adminId);
      return Result.ok(page);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al actualizar contenido de página'));
    }
  }
}

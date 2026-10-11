import { Result } from '../../../../shared-kernel/Result.js';
import { Page, CmsBlock } from '../../domain/entities/Page.js';
import { IPageRepository } from '../../domain/ports/IPageRepository.js';

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
        const existing = await this.pageRepo.findBySlug(input.slug);
        if (existing && existing.id !== page.id) {
          return Result.fail(new Error(`Ya existe una página con el slug '${input.slug}'`));
        }
        page.updateSlug(input.slug);
      }

      if (input.status) {
        page.setStatus(input.status);
      }

      const blocks = input.blocks ?? page.blocks;
      page.updateContent(input.title, blocks, input.seoTitle, input.seoDescription);
      await this.pageRepo.save(page, input.adminId);
      return Result.ok(page);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al actualizar contenido de página'));
    }
  }
}

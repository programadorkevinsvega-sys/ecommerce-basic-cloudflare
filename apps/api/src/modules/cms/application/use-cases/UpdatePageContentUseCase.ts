import { Result } from '../../../../shared-kernel/Result.js';
import { Page, CmsBlock } from '../../domain/entities/Page.js';
import { IPageRepository } from '../../domain/ports/IPageRepository.js';

export interface UpdatePageContentInput {
  id: string;
  title: string;
  blocks: CmsBlock[];
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
      page.updateContent(input.title, input.blocks, input.seoTitle, input.seoDescription);
      await this.pageRepo.save(page, input.adminId);
      return Result.ok(page);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al actualizar contenido de página'));
    }
  }
}

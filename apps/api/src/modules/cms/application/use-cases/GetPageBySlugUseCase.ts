import { Result } from '../../../../shared-kernel/Result.js';
import { Page } from '../../domain/entities/Page.js';
import { IPageRepository } from '../../domain/ports/IPageRepository.js';

export class GetPageBySlugUseCase {
  private readonly pageRepo: IPageRepository;

  public constructor(pageRepo: IPageRepository) {
    this.pageRepo = pageRepo;
  }

  public async execute(slug: string): Promise<Result<Page, Error>> {
    const page = await this.pageRepo.findBySlug(slug);
    if (!page) {
      return Result.fail(new Error(`Página con slug '${slug}' no encontrada`));
    }
    return Result.ok(page);
  }
}

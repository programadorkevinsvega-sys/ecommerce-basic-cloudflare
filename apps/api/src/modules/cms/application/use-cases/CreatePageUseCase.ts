import { Result } from '../../../../shared-kernel/Result.js';
import { Page, PageStatus, CmsBlock } from '../../domain/entities/Page.js';
import { IPageRepository } from '../../domain/ports/IPageRepository.js';

export interface CreatePageInput {
  title: string;
  slug: string;
  status?: PageStatus;
  blocks?: CmsBlock[];
  seoTitle?: string;
  seoDescription?: string;
  adminId?: string;
}

export class CreatePageUseCase {
  private readonly pageRepo: IPageRepository;

  public constructor(pageRepo: IPageRepository) {
    this.pageRepo = pageRepo;
  }

  public async execute(input: CreatePageInput): Promise<Result<Page, Error>> {
    const existing = await this.pageRepo.findBySlug(input.slug);
    if (existing) {
      return Result.fail(new Error(`Ya existe una página con el slug '${input.slug}'`));
    }

    try {
      const now = new Date().toISOString();
      const page = new Page({
        id: crypto.randomUUID(),
        title: input.title,
        slug: input.slug,
        status: input.status || 'draft',
        currentVersion: 1,
        blocks: input.blocks || [],
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        createdAt: now,
        updatedAt: now,
      });

      await this.pageRepo.save(page, input.adminId);
      return Result.ok(page);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al crear página'));
    }
  }
}

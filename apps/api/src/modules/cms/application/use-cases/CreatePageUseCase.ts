import { Result } from '../../../../shared-kernel/Result.js';
import { Page, PageStatus, CmsBlock } from '../../domain/entities/Page.js';
import { IPageRepository } from '../../domain/ports/IPageRepository.js';
import { validateAndFormatSlug } from '../../domain/validateCmsSlug.js';
import { sanitizeHtml } from '../../domain/sanitizeHtml.js';

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
    try {
      const validSlug = validateAndFormatSlug(input.slug || input.title);
      const existing = await this.pageRepo.findBySlug(validSlug);
      if (existing) {
        return Result.fail(new Error(`Ya existe una página con el slug '${validSlug}'`));
      }

      const sanitizedBlocks: CmsBlock[] = (input.blocks || []).map((b) => {
        const content = { ...b.content };
        if (typeof content['html'] === 'string') {
          content['html'] = sanitizeHtml(content['html']);
        }
        if (typeof content['text'] === 'string') {
          content['text'] = sanitizeHtml(content['text']);
        }
        return { ...b, content };
      });

      const now = new Date().toISOString();
      const page = new Page({
        id: crypto.randomUUID(),
        title: input.title.trim(),
        slug: validSlug,
        status: input.status || 'draft',
        currentVersion: 1,
        blocks: sanitizedBlocks,
        seoTitle: input.seoTitle?.trim() || undefined,
        seoDescription: input.seoDescription?.trim() || undefined,
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

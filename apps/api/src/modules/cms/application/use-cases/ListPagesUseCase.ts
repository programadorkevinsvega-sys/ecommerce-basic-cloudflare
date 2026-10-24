import { Result } from '../../../../shared-kernel/Result.js';
import { Page } from '../../domain/entities/Page.js';
import { IPageRepository } from '../../domain/ports/IPageRepository.js';

export interface ListPagesInput {
  limit?: number;
  offset?: number;
  status?: string;
}

export class ListPagesUseCase {
  private readonly pageRepo: IPageRepository;

  public constructor(pageRepo: IPageRepository) {
    this.pageRepo = pageRepo;
  }

  public async execute(input?: ListPagesInput): Promise<Result<Page[], Error>> {
    try {
      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;
      const pages = await this.pageRepo.list(limit, offset, input?.status);
      return Result.ok(pages);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al listar páginas'));
    }
  }

  public count(status?: string): Promise<number> { return this.pageRepo.count(status); }
}

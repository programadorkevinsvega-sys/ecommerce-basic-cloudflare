import { Result } from '../../../../shared-kernel/Result.js';
import { IStorefrontContentRepository } from '../../domain/ports/IStorefrontContentRepository.js';

export class DeleteAnnouncementUseCase {
  private readonly repo: IStorefrontContentRepository;

  public constructor(repo: IStorefrontContentRepository) {
    this.repo = repo;
  }

  public async execute(id: string): Promise<Result<void, Error>> {
    await this.repo.deleteAnnouncement(id);
    return Result.ok(undefined);
  }
}

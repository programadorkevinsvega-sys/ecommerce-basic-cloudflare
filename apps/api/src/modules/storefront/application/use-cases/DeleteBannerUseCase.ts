import { Result } from '../../../../shared-kernel/Result.js';
import { IStorefrontContentRepository } from '../../domain/ports/IStorefrontContentRepository.js';

export class DeleteBannerUseCase {
  private readonly repo: IStorefrontContentRepository;

  public constructor(repo: IStorefrontContentRepository) {
    this.repo = repo;
  }

  public async execute(id: string): Promise<Result<void, Error>> {
    await this.repo.deleteBanner(id);
    return Result.ok(undefined);
  }
}

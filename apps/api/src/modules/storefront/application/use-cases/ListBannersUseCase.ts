import { Result } from '../../../../shared-kernel/Result.js';
import { Banner } from '../../domain/entities/Banner.js';
import { IStorefrontContentRepository } from '../../domain/ports/IStorefrontContentRepository.js';

export class ListBannersUseCase {
  private readonly repo: IStorefrontContentRepository;

  public constructor(repo: IStorefrontContentRepository) {
    this.repo = repo;
  }

  public async execute(): Promise<Result<Banner[], Error>> {
    const banners = await this.repo.findAllBanners();
    return Result.ok(banners);
  }
}

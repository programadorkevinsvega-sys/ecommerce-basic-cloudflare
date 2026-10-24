import { Result } from '../../../../shared-kernel/Result.js';
import { Banner } from '../../domain/entities/Banner.js';
import { IStorefrontContentRepository } from '../../domain/ports/IStorefrontContentRepository.js';

export class ListBannersUseCase {
  private readonly repo: IStorefrontContentRepository;

  public constructor(repo: IStorefrontContentRepository) {
    this.repo = repo;
  }

  public async execute(placement?: string): Promise<Result<Banner[], Error>> {
    const banners = placement ? await this.repo.findActiveBanners(placement) : await this.repo.findAllBanners();
    const visible = placement ? banners.filter((banner) => banner.isCurrentlyVisible()) : banners;
    return Result.ok(visible);
  }

  public listAdmin(limit: number, offset: number, filters?: { type?: 'promotional' | 'informative'; query?: string; placement?: string; isActive?: boolean }) { return this.repo.listAdminBanners(limit, offset, filters); }
}

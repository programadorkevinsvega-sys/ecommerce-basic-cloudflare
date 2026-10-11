import { Result } from '../../../../shared-kernel/Result.js';
import { Banner, BannerProps } from '../../domain/entities/Banner.js';
import { Announcement, AnnouncementProps } from '../../domain/entities/Announcement.js';
import { IStorefrontContentRepository } from '../../domain/ports/IStorefrontContentRepository.js';

export interface StorefrontHomeContentOutput {
  banners: BannerProps[];
  announcements: AnnouncementProps[];
}

export class GetStorefrontHomeContentUseCase {
  private readonly repo: IStorefrontContentRepository;

  public constructor(repo: IStorefrontContentRepository) {
    this.repo = repo;
  }

  public async execute(): Promise<Result<StorefrontHomeContentOutput, Error>> {
    const banners = await this.repo.findActiveBanners('home');
    const announcements = await this.repo.findActiveAnnouncements('top_bar');

    const visibleBanners = banners.filter((b) => b.isCurrentlyVisible());
    const visibleAnnouncements = announcements.filter((a) => a.isCurrentlyActive());

    return Result.ok({
      banners: visibleBanners.map((b) => b.toPrimitives()),
      announcements: visibleAnnouncements.map((a) => a.toPrimitives()),
    });
  }
}

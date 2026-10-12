import { Result } from '../../../../shared-kernel/Result.js';
import { Banner } from '../../domain/entities/Banner.js';
import { IStorefrontContentRepository } from '../../domain/ports/IStorefrontContentRepository.js';

export interface UpdateBannerInput {
  id: string;
  title?: string;
  description?: string;
  bannerType?: 'informative' | 'promotional';
  buttonText?: string;
  placement?: 'home' | 'category' | 'product' | 'checkout';
  imageUrl?: string;
  linkUrl?: string;
  altText?: string;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
  sortOrder?: number;
}

export class UpdateBannerUseCase {
  private readonly repo: IStorefrontContentRepository;

  public constructor(repo: IStorefrontContentRepository) {
    this.repo = repo;
  }

  public async execute(input: UpdateBannerInput): Promise<Result<Banner, Error>> {
    const banner = await this.repo.findBannerById(input.id);
    if (!banner) {
      return Result.fail(new Error('Banner no encontrado'));
    }

    try {
      banner.updateDetails(input);
      await this.repo.saveBanner(banner);
      return Result.ok(banner);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al actualizar banner'));
    }
  }
}

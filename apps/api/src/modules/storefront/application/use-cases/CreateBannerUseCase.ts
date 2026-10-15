import { Result } from '../../../../shared-kernel/Result.js';
import { Banner } from '../../domain/entities/Banner.js';
import { IStorefrontContentRepository } from '../../domain/ports/IStorefrontContentRepository.js';

export interface CreateBannerInput {
  title: string;
  description?: string;
  bannerType?: 'informative' | 'promotional';
  buttonText?: string;
  placement: string;
  imageUrl: string;
  linkUrl?: string;
  altText: string;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
  sortOrder?: number;
}

export class CreateBannerUseCase {
  private readonly repo: IStorefrontContentRepository;

  public constructor(repo: IStorefrontContentRepository) {
    this.repo = repo;
  }

  public async execute(input: CreateBannerInput): Promise<Result<Banner, Error>> {
    try {
      const now = new Date().toISOString();
      const banner = new Banner({
        id: crypto.randomUUID(),
        title: input.title,
        description: input.description,
        bannerType: input.bannerType || 'promotional',
        buttonText: input.buttonText,
        placement: input.placement,
        imageUrl: input.imageUrl,
        linkUrl: input.linkUrl?.trim() || '',
        altText: input.altText,
        isActive: input.isActive ?? true,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        sortOrder: input.sortOrder ?? 0,
        createdAt: now,
        updatedAt: now,
      });

      await this.repo.saveBanner(banner);
      return Result.ok(banner);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al crear banner'));
    }
  }
}

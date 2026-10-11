import { Result } from '../../../../shared-kernel/Result.js';
import { Banner } from '../../domain/entities/Banner.js';
import { IStorefrontContentRepository } from '../../domain/ports/IStorefrontContentRepository.js';

export interface CreateBannerInput {
  title: string;
  placement: 'home' | 'category' | 'product' | 'checkout';
  imageUrl: string;
  linkUrl: string;
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
        placement: input.placement,
        imageUrl: input.imageUrl,
        linkUrl: input.linkUrl,
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

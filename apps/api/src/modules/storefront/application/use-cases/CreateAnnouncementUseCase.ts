import { Result } from '../../../../shared-kernel/Result.js';
import { Announcement } from '../../domain/entities/Announcement.js';
import { IStorefrontContentRepository } from '../../domain/ports/IStorefrontContentRepository.js';

export interface CreateAnnouncementInput {
  message: string;
  placement: string;
  linkUrl?: string;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
}

export class CreateAnnouncementUseCase {
  private readonly repo: IStorefrontContentRepository;

  public constructor(repo: IStorefrontContentRepository) {
    this.repo = repo;
  }

  public async execute(input: CreateAnnouncementInput): Promise<Result<Announcement, Error>> {
    try {
      const now = new Date().toISOString();
      const announcement = new Announcement({
        id: crypto.randomUUID(),
        message: input.message,
        placement: input.placement,
        linkUrl: input.linkUrl,
        isActive: input.isActive ?? true,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        createdAt: now,
        updatedAt: now,
      });

      await this.repo.saveAnnouncement(announcement);
      return Result.ok(announcement);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al crear anuncio'));
    }
  }
}

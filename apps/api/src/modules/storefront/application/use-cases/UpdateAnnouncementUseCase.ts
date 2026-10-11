import { Result } from '../../../../shared-kernel/Result.js';
import { Announcement } from '../../domain/entities/Announcement.js';
import { IStorefrontContentRepository } from '../../domain/ports/IStorefrontContentRepository.js';

export interface UpdateAnnouncementInput {
  id: string;
  message?: string;
  placement?: 'top_bar' | 'home' | 'products';
  linkUrl?: string;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
}

export class UpdateAnnouncementUseCase {
  private readonly repo: IStorefrontContentRepository;

  public constructor(repo: IStorefrontContentRepository) {
    this.repo = repo;
  }

  public async execute(input: UpdateAnnouncementInput): Promise<Result<Announcement, Error>> {
    const announcement = await this.repo.findAnnouncementById(input.id);
    if (!announcement) {
      return Result.fail(new Error('Anuncio no encontrado'));
    }

    try {
      announcement.updateDetails(input);
      await this.repo.saveAnnouncement(announcement);
      return Result.ok(announcement);
    } catch (err) {
      return Result.fail(err instanceof Error ? err : new Error('Error al actualizar anuncio'));
    }
  }
}

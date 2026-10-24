import { Result } from '../../../../shared-kernel/Result.js';
import { Announcement } from '../../domain/entities/Announcement.js';
import { IStorefrontContentRepository } from '../../domain/ports/IStorefrontContentRepository.js';

export class ListAnnouncementsUseCase {
  private readonly repo: IStorefrontContentRepository;

  public constructor(repo: IStorefrontContentRepository) {
    this.repo = repo;
  }

  public async execute(): Promise<Result<Announcement[], Error>> {
    const announcements = await this.repo.findAllAnnouncements();
    return Result.ok(announcements);
  }

  public listAdmin(limit: number, offset: number) { return this.repo.listAdminAnnouncements(limit, offset); }
}

import { Banner } from '../entities/Banner.js';
import { Announcement } from '../entities/Announcement.js';

export interface IStorefrontContentRepository {
  findActiveBanners(placement: string): Promise<Banner[]>;
  saveBanner(banner: Banner): Promise<void>;
  findActiveAnnouncements(placement: string): Promise<Announcement[]>;
  saveAnnouncement(announcement: Announcement): Promise<void>;
}

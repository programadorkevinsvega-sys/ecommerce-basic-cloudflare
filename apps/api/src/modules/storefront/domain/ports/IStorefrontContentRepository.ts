import { Banner } from '../entities/Banner.js';
import { Announcement } from '../entities/Announcement.js';

export interface IStorefrontContentRepository {
  findActiveBanners(placement: string): Promise<Banner[]>;
  findAllBanners(): Promise<Banner[]>;
  findBannerById(id: string): Promise<Banner | null>;
  saveBanner(banner: Banner): Promise<void>;
  deleteBanner(id: string): Promise<void>;

  findActiveAnnouncements(placement: string): Promise<Announcement[]>;
  findAllAnnouncements(): Promise<Announcement[]>;
  findAnnouncementById(id: string): Promise<Announcement | null>;
  saveAnnouncement(announcement: Announcement): Promise<void>;
  deleteAnnouncement(id: string): Promise<void>;
}

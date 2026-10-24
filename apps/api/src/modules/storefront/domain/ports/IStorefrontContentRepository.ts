import { Banner } from '../entities/Banner.js';
import { Announcement } from '../entities/Announcement.js';

export interface IStorefrontContentRepository {
  findActiveBanners(placement: string): Promise<Banner[]>;
  findAllBanners(): Promise<Banner[]>;
  listAdminBanners(limit: number, offset: number, filters?: { type?: 'promotional' | 'informative'; query?: string; placement?: string; isActive?: boolean }): Promise<{ items: Banner[]; total: number }>;
  findBannerById(id: string): Promise<Banner | null>;
  saveBanner(banner: Banner): Promise<void>;
  deleteBanner(id: string): Promise<void>;

  findActiveAnnouncements(placement: string): Promise<Announcement[]>;
  findAllAnnouncements(): Promise<Announcement[]>;
  listAdminAnnouncements(limit: number, offset: number): Promise<{ items: Announcement[]; total: number }>;
  findAnnouncementById(id: string): Promise<Announcement | null>;
  saveAnnouncement(announcement: Announcement): Promise<void>;
  deleteAnnouncement(id: string): Promise<void>;
}

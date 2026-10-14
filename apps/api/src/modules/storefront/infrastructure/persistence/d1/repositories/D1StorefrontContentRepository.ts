import { Banner } from '../../../../domain/entities/Banner.js';
import { Announcement } from '../../../../domain/entities/Announcement.js';
import { IStorefrontContentRepository } from '../../../../domain/ports/IStorefrontContentRepository.js';

interface BannerRow {
  id: string;
  title: string;
  description?: string;
  banner_type?: 'informative' | 'promotional';
  button_text?: string;
  placement: string;
  image_url: string;
  link_url: string;
  alt_text: string;
  is_active: number;
  starts_at?: string;
  ends_at?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface AnnouncementRow {
  id: string;
  message: string;
  placement: string;
  link_url?: string;
  is_active: number;
  starts_at?: string;
  ends_at?: string;
  created_at: string;
  updated_at: string;
}

export class D1StorefrontContentRepository implements IStorefrontContentRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async findActiveBanners(placement: string): Promise<Banner[]> {
    const now = new Date().toISOString();
    const { results } = await this.db
      .prepare('SELECT * FROM storefront_banners WHERE placement = ? AND is_active = 1 AND (starts_at IS NULL OR starts_at <= ?) AND (ends_at IS NULL OR ends_at >= ?) ORDER BY sort_order ASC, created_at DESC')
      .bind(placement, now, now)
      .all<BannerRow>();
    return (results || []).map((r) => this.hydrateBanner(r));
  }

  public async findAllBanners(): Promise<Banner[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM storefront_banners ORDER BY sort_order ASC, created_at DESC')
      .all<BannerRow>();
    return (results || []).map((r) => this.hydrateBanner(r));
  }

  public async findBannerById(id: string): Promise<Banner | null> {
    const row = await this.db
      .prepare('SELECT * FROM storefront_banners WHERE id = ?')
      .bind(id)
      .first<BannerRow>();
    return row ? this.hydrateBanner(row) : null;
  }

  public async saveBanner(banner: Banner): Promise<void> {
    const p = banner.toPrimitives();
    await this.db
      .prepare(
        `INSERT INTO storefront_banners (
          id, title, description, banner_type, button_text, placement, image_url, link_url, alt_text, is_active,
          starts_at, ends_at, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          description = excluded.description,
          banner_type = excluded.banner_type,
          button_text = excluded.button_text,
          placement = excluded.placement,
          image_url = excluded.image_url,
          link_url = excluded.link_url,
          alt_text = excluded.alt_text,
          is_active = excluded.is_active,
          starts_at = excluded.starts_at,
          ends_at = excluded.ends_at,
          sort_order = excluded.sort_order,
          updated_at = excluded.updated_at`
      )
      .bind(
        p.id, p.title, p.description ?? null, p.bannerType, p.buttonText ?? null,
        p.placement, p.imageUrl, p.linkUrl, p.altText,
        p.isActive ? 1 : 0, p.startsAt ?? null, p.endsAt ?? null,
        p.sortOrder, p.createdAt, p.updatedAt
      )
      .run();
  }

  public async deleteBanner(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM storefront_banners WHERE id = ?').bind(id).run();
  }

  public async findActiveAnnouncements(placement: string): Promise<Announcement[]> {
    const now = new Date().toISOString();
    const { results } = await this.db
      .prepare('SELECT * FROM storefront_announcements WHERE placement = ? AND is_active = 1 AND (starts_at IS NULL OR starts_at <= ?) AND (ends_at IS NULL OR ends_at >= ?) ORDER BY created_at DESC')
      .bind(placement, now, now)
      .all<AnnouncementRow>();
    return (results || []).map((r) => this.hydrateAnnouncement(r));
  }

  public async findAllAnnouncements(): Promise<Announcement[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM storefront_announcements ORDER BY created_at DESC')
      .all<AnnouncementRow>();
    return (results || []).map((r) => this.hydrateAnnouncement(r));
  }

  public async findAnnouncementById(id: string): Promise<Announcement | null> {
    const row = await this.db
      .prepare('SELECT * FROM storefront_announcements WHERE id = ?')
      .bind(id)
      .first<AnnouncementRow>();
    return row ? this.hydrateAnnouncement(row) : null;
  }

  public async saveAnnouncement(announcement: Announcement): Promise<void> {
    const p = announcement.toPrimitives();
    await this.db
      .prepare(
        `INSERT INTO storefront_announcements (
          id, message, placement, link_url, is_active, starts_at, ends_at,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          message = excluded.message,
          placement = excluded.placement,
          link_url = excluded.link_url,
          is_active = excluded.is_active,
          starts_at = excluded.starts_at,
          ends_at = excluded.ends_at,
          updated_at = excluded.updated_at`
      )
      .bind(
        p.id, p.message, p.placement, p.linkUrl ?? null,
        p.isActive ? 1 : 0, p.startsAt ?? null, p.endsAt ?? null,
        p.createdAt, p.updatedAt
      )
      .run();
  }

  public async deleteAnnouncement(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM storefront_announcements WHERE id = ?').bind(id).run();
  }

  private hydrateBanner(r: BannerRow): Banner {
    return new Banner({
      id: r.id,
      title: r.title,
      description: r.description || undefined,
      bannerType: r.banner_type || 'promotional',
      buttonText: r.button_text || undefined,
      placement: r.placement,
      imageUrl: r.image_url,
      linkUrl: r.link_url,
      altText: r.alt_text,
      isActive: r.is_active === 1,
      startsAt: r.starts_at,
      endsAt: r.ends_at,
      sortOrder: r.sort_order,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    });
  }

  private hydrateAnnouncement(r: AnnouncementRow): Announcement {
    return new Announcement({
      id: r.id,
      message: r.message,
      placement: r.placement,
      linkUrl: r.link_url,
      isActive: r.is_active === 1,
      startsAt: r.starts_at,
      endsAt: r.ends_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    });
  }
}

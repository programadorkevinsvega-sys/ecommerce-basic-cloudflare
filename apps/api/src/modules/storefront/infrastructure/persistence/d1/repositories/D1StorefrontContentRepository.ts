import { Banner } from '../../../../domain/entities/Banner.js';
import { Announcement } from '../../../../domain/entities/Announcement.js';
import { IStorefrontContentRepository } from '../../../../domain/ports/IStorefrontContentRepository.js';

interface BannerRow {
  id: string;
  title: string;
  placement: 'home' | 'category' | 'product' | 'checkout';
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
  placement: 'top_bar' | 'home' | 'products';
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
    const { results } = await this.db
      .prepare(
        'SELECT * FROM storefront_banners WHERE placement = ? AND is_active = 1 ORDER BY sort_order ASC'
      )
      .bind(placement)
      .all<BannerRow>();

    return (results || []).map(
      (r) =>
        new Banner({
          id: r.id,
          title: r.title,
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
        })
    );
  }

  public async saveBanner(banner: Banner): Promise<void> {
    const p = banner.toPrimitives();
    await this.db
      .prepare(
        `INSERT INTO storefront_banners (
          id, title, placement, image_url, link_url, alt_text, is_active,
          starts_at, ends_at, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          image_url = excluded.image_url,
          link_url = excluded.link_url,
          alt_text = excluded.alt_text,
          is_active = excluded.is_active,
          updated_at = excluded.updated_at`
      )
      .bind(
        p.id, p.title, p.placement, p.imageUrl, p.linkUrl, p.altText,
        p.isActive ? 1 : 0, p.startsAt ?? null, p.endsAt ?? null,
        p.sortOrder, p.createdAt, p.updatedAt
      )
      .run();
  }

  public async findActiveAnnouncements(placement: string): Promise<Announcement[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM storefront_announcements WHERE placement = ? AND is_active = 1')
      .bind(placement)
      .all<AnnouncementRow>();

    return (results || []).map(
      (r) =>
        new Announcement({
          id: r.id,
          message: r.message,
          placement: r.placement,
          linkUrl: r.link_url,
          isActive: r.is_active === 1,
          startsAt: r.starts_at,
          endsAt: r.ends_at,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        })
    );
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
          link_url = excluded.link_url,
          is_active = excluded.is_active,
          updated_at = excluded.updated_at`
      )
      .bind(
        p.id, p.message, p.placement, p.linkUrl ?? null,
        p.isActive ? 1 : 0, p.startsAt ?? null, p.endsAt ?? null,
        p.createdAt, p.updatedAt
      )
      .run();
  }
}

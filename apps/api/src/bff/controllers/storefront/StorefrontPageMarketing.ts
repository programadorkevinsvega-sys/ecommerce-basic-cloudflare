import type { BannerItemDto, StorefrontGateway } from '../../gateways/storefront/StorefrontGateway.js';
import { renderStorefrontBanners } from '../../views/renderStorefrontBanners.js';

export interface PageMarketingContent {
  banners: BannerItemDto[];
  bannersHtml: string;
  announcementItems: Array<{ message: string; linkUrl?: string }>;
  announcementMessage?: string;
  announcementLink?: string;
}

export async function getPageMarketingContent(
  storefront: StorefrontGateway,
  placement: string,
  label: string,
  aliases: string[] = []
): Promise<PageMarketingContent> {
  const [bannerGroups, ...announcementGroups] = await Promise.all([
    Promise.all([placement, ...aliases].map((target) => storefront.getPublicBanners(target))),
    ...[placement, ...aliases, 'top_bar'].map((target) => storefront.getPublicAnnouncements(target)),
  ]);
  const banners = [...new Map(bannerGroups.flat().map((banner) => [banner.id, banner])).values()];
  const announcementItems = [...new Map(announcementGroups.flat().map((announcement) => [announcement.id, {
    message: announcement.message,
    linkUrl: announcement.linkUrl,
  }])).values()];
  const announcement = announcementItems[0];
  return {
    banners,
    bannersHtml: renderStorefrontBanners(banners, label),
    announcementItems,
    announcementMessage: announcement?.message,
    announcementLink: announcement?.linkUrl,
  };
}

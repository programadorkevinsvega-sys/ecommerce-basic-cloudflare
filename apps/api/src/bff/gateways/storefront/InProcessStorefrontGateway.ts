import {
  StorefrontGateway,
  StorefrontHomeData,
  BannerItemDto,
  UpdateBannerGatewayRequest,
  AnnouncementItemDto,
  UpdateAnnouncementGatewayRequest,
  CreateBannerGatewayRequest,
} from './StorefrontGateway.js';
import { IStorefrontPublicApi } from '../../../modules/storefront/module.public-api.js';

export class InProcessStorefrontGateway implements StorefrontGateway {
  private readonly publicApi: IStorefrontPublicApi;

  public constructor(publicApi: IStorefrontPublicApi) {
    this.publicApi = publicApi;
  }

  public async getHomeContent(): Promise<StorefrontHomeData> {
    const res = await this.publicApi.getHomeContent();
    return {
      banners: res.banners.map((b) => ({
        id: b.id,
        title: b.title,
        description: b.description,
        bannerType: b.bannerType,
        buttonText: b.buttonText,
        imageUrl: b.imageUrl,
        linkUrl: b.linkUrl,
        altText: b.altText,
        sortOrder: b.sortOrder,
      })),
      announcements: res.announcements.map((a) => ({
        id: a.id,
        message: a.message,
        linkUrl: a.linkUrl,
      })),
    };
  }

  public async createBanner(request: CreateBannerGatewayRequest): Promise<{ id: string; title: string }> {
    const banner = await this.publicApi.createBanner(request);
    return { id: banner.id, title: banner.title };
  }

  public async updateBanner(request: UpdateBannerGatewayRequest): Promise<BannerItemDto> {
    const banner = await this.publicApi.updateBanner(request);
    return banner.toPrimitives();
  }

  public async listBanners(): Promise<BannerItemDto[]> {
    const banners = await this.publicApi.listBanners();
    return banners.map((b) => b.toPrimitives());
  }

  public async listAdminBanners(limit: number, offset: number, filters?: { type?: 'promotional' | 'informative'; query?: string; placement?: string; isActive?: boolean }) {
    const result = await this.publicApi.listAdminBanners(limit, offset, filters);
    return { items: result.items.map((banner) => banner.toPrimitives()), total: result.total };
  }

  public async getBannerById(id: string) { return (await this.publicApi.getBannerById(id))?.toPrimitives() ?? null; }

  public async getPublicBanners(placement: string): Promise<BannerItemDto[]> {
    const banners = await this.publicApi.listBanners(placement);
    return banners.map((banner) => banner.toPrimitives());
  }

  public async deleteBanner(id: string): Promise<void> {
    await this.publicApi.deleteBanner(id);
  }

  public async createAnnouncement(request: {
    message: string;
    placement: string;
    linkUrl?: string;
  }): Promise<{ id: string; message: string }> {
    const announcement = await this.publicApi.createAnnouncement(request);
    return { id: announcement.id, message: announcement.message };
  }

  public async updateAnnouncement(request: UpdateAnnouncementGatewayRequest): Promise<AnnouncementItemDto> {
    const announcement = await this.publicApi.updateAnnouncement(request);
    return announcement.toPrimitives();
  }

  public async listAnnouncements(): Promise<AnnouncementItemDto[]> {
    const announcements = await this.publicApi.listAnnouncements();
    return announcements.map((a) => a.toPrimitives());
  }

  public async listAdminAnnouncements(limit: number, offset: number) {
    const result = await this.publicApi.listAdminAnnouncements(limit, offset);
    return { items: result.items.map((announcement) => announcement.toPrimitives()), total: result.total };
  }

  public async getAnnouncementById(id: string) { return (await this.publicApi.getAnnouncementById(id))?.toPrimitives() ?? null; }

  public async getPublicAnnouncements(placement: string): Promise<AnnouncementItemDto[]> {
    const announcements = await this.publicApi.listAnnouncements();
    return announcements.filter((item) => item.placement === placement && item.isCurrentlyActive()).map((item) => item.toPrimitives());
  }

  public async deleteAnnouncement(id: string): Promise<void> {
    await this.publicApi.deleteAnnouncement(id);
  }
}

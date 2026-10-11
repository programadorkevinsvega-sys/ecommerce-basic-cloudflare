import {
  StorefrontGateway,
  StorefrontHomeData,
  BannerItemDto,
  AnnouncementItemDto,
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

  public async listBanners(): Promise<BannerItemDto[]> {
    const banners = await this.publicApi.listBanners();
    return banners.map((b) => b.toPrimitives());
  }

  public async deleteBanner(id: string): Promise<void> {
    await this.publicApi.deleteBanner(id);
  }

  public async createAnnouncement(request: {
    message: string;
    placement: 'top_bar' | 'home' | 'products';
    linkUrl?: string;
  }): Promise<{ id: string; message: string }> {
    const announcement = await this.publicApi.createAnnouncement(request);
    return { id: announcement.id, message: announcement.message };
  }

  public async listAnnouncements(): Promise<AnnouncementItemDto[]> {
    const announcements = await this.publicApi.listAnnouncements();
    return announcements.map((a) => a.toPrimitives());
  }

  public async deleteAnnouncement(id: string): Promise<void> {
    await this.publicApi.deleteAnnouncement(id);
  }
}

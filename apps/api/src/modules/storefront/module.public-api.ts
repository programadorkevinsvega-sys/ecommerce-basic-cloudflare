import { StorefrontModuleContainer } from './module.config.js';
import { StorefrontHomeContentOutput } from './application/use-cases/GetStorefrontHomeContentUseCase.js';
import { CreateBannerInput } from './application/use-cases/CreateBannerUseCase.js';
import { UpdateBannerInput } from './application/use-cases/UpdateBannerUseCase.js';
import { CreateAnnouncementInput } from './application/use-cases/CreateAnnouncementUseCase.js';
import { UpdateAnnouncementInput } from './application/use-cases/UpdateAnnouncementUseCase.js';
import { Banner } from './domain/entities/Banner.js';
import { Announcement } from './domain/entities/Announcement.js';

export interface IStorefrontPublicApi {
  getHomeContent(): Promise<StorefrontHomeContentOutput>;
  createBanner(input: CreateBannerInput): Promise<Banner>;
  updateBanner(input: UpdateBannerInput): Promise<Banner>;
  listBanners(placement?: string): Promise<Banner[]>;
  listAdminBanners(limit: number, offset: number, filters?: { type?: 'promotional' | 'informative'; query?: string; placement?: string; isActive?: boolean }): Promise<{ items: Banner[]; total: number }>;
  getBannerById(id: string): Promise<Banner | null>;
  deleteBanner(id: string): Promise<void>;
  createAnnouncement(input: CreateAnnouncementInput): Promise<Announcement>;
  updateAnnouncement(input: UpdateAnnouncementInput): Promise<Announcement>;
  listAnnouncements(): Promise<Announcement[]>;
  listAdminAnnouncements(limit: number, offset: number): Promise<{ items: Announcement[]; total: number }>;
  getAnnouncementById(id: string): Promise<Announcement | null>;
  deleteAnnouncement(id: string): Promise<void>;
}

export class StorefrontPublicApi implements IStorefrontPublicApi {
  private readonly container: StorefrontModuleContainer;

  public constructor(container: StorefrontModuleContainer) {
    this.container = container;
  }

  public async getHomeContent(): Promise<StorefrontHomeContentOutput> {
    const res = await this.container.getStorefrontHomeContentUseCase.execute();
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async createBanner(input: CreateBannerInput): Promise<Banner> {
    const res = await this.container.createBannerUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async updateBanner(input: UpdateBannerInput): Promise<Banner> {
    const res = await this.container.updateBannerUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async listBanners(placement?: string): Promise<Banner[]> {
    const res = await this.container.listBannersUseCase.execute(placement);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public listAdminBanners(limit: number, offset: number, filters?: { type?: 'promotional' | 'informative'; query?: string; placement?: string; isActive?: boolean }) { return this.container.listBannersUseCase.listAdmin(limit, offset, filters); }
  public getBannerById(id: string) { return this.container.contentRepository.findBannerById(id); }

  public async deleteBanner(id: string): Promise<void> {
    const res = await this.container.deleteBannerUseCase.execute(id);
    if (res.isFail()) throw res.error;
  }

  public async createAnnouncement(input: CreateAnnouncementInput): Promise<Announcement> {
    const res = await this.container.createAnnouncementUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async updateAnnouncement(input: UpdateAnnouncementInput): Promise<Announcement> {
    const res = await this.container.updateAnnouncementUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async listAnnouncements(): Promise<Announcement[]> {
    const res = await this.container.listAnnouncementsUseCase.execute();
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public listAdminAnnouncements(limit: number, offset: number) { return this.container.listAnnouncementsUseCase.listAdmin(limit, offset); }
  public getAnnouncementById(id: string) { return this.container.contentRepository.findAnnouncementById(id); }

  public async deleteAnnouncement(id: string): Promise<void> {
    const res = await this.container.deleteAnnouncementUseCase.execute(id);
    if (res.isFail()) throw res.error;
  }
}

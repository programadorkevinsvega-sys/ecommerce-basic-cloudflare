import { StorefrontModuleContainer } from './module.config.js';
import { StorefrontHomeContentOutput } from './application/use-cases/GetStorefrontHomeContentUseCase.js';
import { CreateBannerInput } from './application/use-cases/CreateBannerUseCase.js';
import { CreateAnnouncementInput } from './application/use-cases/CreateAnnouncementUseCase.js';
import { Banner } from './domain/entities/Banner.js';
import { Announcement } from './domain/entities/Announcement.js';

export interface IStorefrontPublicApi {
  getHomeContent(): Promise<StorefrontHomeContentOutput>;
  createBanner(input: CreateBannerInput): Promise<Banner>;
  createAnnouncement(input: CreateAnnouncementInput): Promise<Announcement>;
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

  public async createAnnouncement(input: CreateAnnouncementInput): Promise<Announcement> {
    const res = await this.container.createAnnouncementUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }
}

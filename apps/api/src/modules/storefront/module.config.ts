import { Env } from '../../platform/Env.js';
import { D1StorefrontContentRepository } from './infrastructure/persistence/d1/repositories/D1StorefrontContentRepository.js';
import { GetStorefrontHomeContentUseCase } from './application/use-cases/GetStorefrontHomeContentUseCase.js';
import { CreateBannerUseCase } from './application/use-cases/CreateBannerUseCase.js';
import { UpdateBannerUseCase } from './application/use-cases/UpdateBannerUseCase.js';
import { ListBannersUseCase } from './application/use-cases/ListBannersUseCase.js';
import { DeleteBannerUseCase } from './application/use-cases/DeleteBannerUseCase.js';
import { CreateAnnouncementUseCase } from './application/use-cases/CreateAnnouncementUseCase.js';
import { UpdateAnnouncementUseCase } from './application/use-cases/UpdateAnnouncementUseCase.js';
import { ListAnnouncementsUseCase } from './application/use-cases/ListAnnouncementsUseCase.js';
import { DeleteAnnouncementUseCase } from './application/use-cases/DeleteAnnouncementUseCase.js';
import { IStorefrontContentRepository } from './domain/ports/IStorefrontContentRepository.js';

export interface StorefrontModuleContainer {
  contentRepository: IStorefrontContentRepository;
  getStorefrontHomeContentUseCase: GetStorefrontHomeContentUseCase;
  createBannerUseCase: CreateBannerUseCase;
  updateBannerUseCase: UpdateBannerUseCase;
  listBannersUseCase: ListBannersUseCase;
  deleteBannerUseCase: DeleteBannerUseCase;
  createAnnouncementUseCase: CreateAnnouncementUseCase;
  updateAnnouncementUseCase: UpdateAnnouncementUseCase;
  listAnnouncementsUseCase: ListAnnouncementsUseCase;
  deleteAnnouncementUseCase: DeleteAnnouncementUseCase;
}

export function createStorefrontModule(env: Env): StorefrontModuleContainer {
  const repo = new D1StorefrontContentRepository(env.DB);

  return {
    contentRepository: repo,
    getStorefrontHomeContentUseCase: new GetStorefrontHomeContentUseCase(repo),
    createBannerUseCase: new CreateBannerUseCase(repo),
    updateBannerUseCase: new UpdateBannerUseCase(repo),
    listBannersUseCase: new ListBannersUseCase(repo),
    deleteBannerUseCase: new DeleteBannerUseCase(repo),
    createAnnouncementUseCase: new CreateAnnouncementUseCase(repo),
    updateAnnouncementUseCase: new UpdateAnnouncementUseCase(repo),
    listAnnouncementsUseCase: new ListAnnouncementsUseCase(repo),
    deleteAnnouncementUseCase: new DeleteAnnouncementUseCase(repo),
  };
}

import { Env } from '../../platform/Env.js';
import { D1StorefrontContentRepository } from './infrastructure/persistence/d1/repositories/D1StorefrontContentRepository.js';
import { GetStorefrontHomeContentUseCase } from './application/use-cases/GetStorefrontHomeContentUseCase.js';
import { CreateBannerUseCase } from './application/use-cases/CreateBannerUseCase.js';
import { CreateAnnouncementUseCase } from './application/use-cases/CreateAnnouncementUseCase.js';

export interface StorefrontModuleContainer {
  getStorefrontHomeContentUseCase: GetStorefrontHomeContentUseCase;
  createBannerUseCase: CreateBannerUseCase;
  createAnnouncementUseCase: CreateAnnouncementUseCase;
}

export function createStorefrontModule(env: Env): StorefrontModuleContainer {
  const repo = new D1StorefrontContentRepository(env.DB);

  return {
    getStorefrontHomeContentUseCase: new GetStorefrontHomeContentUseCase(repo),
    createBannerUseCase: new CreateBannerUseCase(repo),
    createAnnouncementUseCase: new CreateAnnouncementUseCase(repo),
  };
}

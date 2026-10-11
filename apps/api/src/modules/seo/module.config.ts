import { Env } from '../../platform/Env.js';
import { D1RedirectRepository } from './infrastructure/persistence/d1/repositories/D1RedirectRepository.js';
import { CreateRedirectUseCase } from './application/use-cases/CreateRedirectUseCase.js';
import { ResolveRedirectUseCase } from './application/use-cases/ResolveRedirectUseCase.js';

export interface SeoModuleContainer {
  createRedirectUseCase: CreateRedirectUseCase;
  resolveRedirectUseCase: ResolveRedirectUseCase;
}

export function createSeoModule(env: Env): SeoModuleContainer {
  const redirectRepo = new D1RedirectRepository(env.DB);

  return {
    createRedirectUseCase: new CreateRedirectUseCase(redirectRepo),
    resolveRedirectUseCase: new ResolveRedirectUseCase(redirectRepo),
  };
}

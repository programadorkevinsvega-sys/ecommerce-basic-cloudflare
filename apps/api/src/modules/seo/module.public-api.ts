import { SeoModuleContainer } from './module.config.js';
import { CreateRedirectInput } from './application/use-cases/CreateRedirectUseCase.js';
import { Redirect } from './domain/entities/Redirect.js';

export interface ISeoPublicApi {
  createRedirect(input: CreateRedirectInput): Promise<Redirect>;
  resolveRedirect(fromPath: string): Promise<{ toPath: string; statusCode: number } | null>;
}

export class SeoPublicApi implements ISeoPublicApi {
  private readonly container: SeoModuleContainer;

  public constructor(container: SeoModuleContainer) {
    this.container = container;
  }

  public async createRedirect(input: CreateRedirectInput): Promise<Redirect> {
    const res = await this.container.createRedirectUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async resolveRedirect(fromPath: string): Promise<{ toPath: string; statusCode: number } | null> {
    const res = await this.container.resolveRedirectUseCase.execute(fromPath);
    if (res.isFail()) throw res.error;
    return res.value;
  }
}

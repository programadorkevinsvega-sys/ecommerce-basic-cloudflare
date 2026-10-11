import {
  SeoGateway,
  CreateRedirectGatewayRequest,
} from './SeoGateway.js';
import { ISeoPublicApi } from '../../../modules/seo/module.public-api.js';

export class InProcessSeoGateway implements SeoGateway {
  private readonly publicApi: ISeoPublicApi;

  public constructor(publicApi: ISeoPublicApi) {
    this.publicApi = publicApi;
  }

  public async createRedirect(request: CreateRedirectGatewayRequest): Promise<{ id: string; fromPath: string; toPath: string }> {
    const redirect = await this.publicApi.createRedirect(request);
    return {
      id: redirect.id,
      fromPath: redirect.fromPath,
      toPath: redirect.toPath,
    };
  }

  public async resolveRedirect(fromPath: string): Promise<{ toPath: string; statusCode: number } | null> {
    return this.publicApi.resolveRedirect(fromPath);
  }
}

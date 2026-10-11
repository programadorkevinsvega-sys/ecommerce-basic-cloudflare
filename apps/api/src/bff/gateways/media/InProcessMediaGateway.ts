import {
  MediaGateway,
  MediaUploadRequest,
  MediaUploadResponse,
  MediaServeResponse,
} from './MediaGateway.js';
import { IMediaPublicApi } from '../../../modules/media/module.public-api.js';

export class InProcessMediaGateway implements MediaGateway {
  private readonly publicApi: IMediaPublicApi;

  public constructor(publicApi: IMediaPublicApi) {
    this.publicApi = publicApi;
  }

  public async uploadMedia(request: MediaUploadRequest): Promise<MediaUploadResponse> {
    return this.publicApi.uploadMedia(request);
  }

  public async getMedia(assetId: string): Promise<MediaServeResponse> {
    return this.publicApi.getMedia(assetId);
  }

  public async resolveMedia(mediaId: string): Promise<{ id: string; publicUrl: string; altText: string }> {
    const res = await this.publicApi.resolveMedia(mediaId);
    return {
      id: res.id,
      publicUrl: res.publicUrl,
      altText: res.altText,
    };
  }
}

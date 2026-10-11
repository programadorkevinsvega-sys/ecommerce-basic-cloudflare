import { MediaModuleContainer } from './module.config.js';
import { UploadMediaInput, UploadMediaOutput } from './application/use-cases/UploadMediaUseCase.js';
import { ServeMediaOutput } from './application/use-cases/GetMediaAssetUseCase.js';
import { MediaAssetDto } from './application/use-cases/ResolveMediaUrlUseCase.js';

export interface IMediaPublicApi {
  uploadMedia(input: UploadMediaInput): Promise<UploadMediaOutput>;
  getMedia(assetId: string): Promise<ServeMediaOutput>;
  resolveMedia(mediaId: string): Promise<MediaAssetDto>;
}

export class MediaPublicApi implements IMediaPublicApi {
  private readonly container: MediaModuleContainer;

  public constructor(container: MediaModuleContainer) {
    this.container = container;
  }

  public async uploadMedia(input: UploadMediaInput): Promise<UploadMediaOutput> {
    const res = await this.container.uploadMediaUseCase.execute(input);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async getMedia(assetId: string): Promise<ServeMediaOutput> {
    const res = await this.container.getMediaAssetUseCase.execute(assetId);
    if (res.isFail()) throw res.error;
    return res.value;
  }

  public async resolveMedia(mediaId: string): Promise<MediaAssetDto> {
    const res = await this.container.resolveMediaUrlUseCase.execute(mediaId);
    if (res.isFail()) throw res.error;
    return res.value;
  }
}

import { Env } from '../../platform/Env.js';
import { R2MediaStorageAdapter } from './infrastructure/storage/r2/R2MediaStorageAdapter.js';
import { D1MediaAssetRepository } from './infrastructure/persistence/d1/repositories/D1MediaAssetRepository.js';
import { UploadMediaUseCase } from './application/use-cases/UploadMediaUseCase.js';
import { GetMediaAssetUseCase } from './application/use-cases/GetMediaAssetUseCase.js';
import { ResolveMediaUrlUseCase } from './application/use-cases/ResolveMediaUrlUseCase.js';
import { CloudflareImageProcessor } from './infrastructure/images/CloudflareImageProcessor.js';
import { CollectOrphanedMediaUseCase } from './application/use-cases/CollectOrphanedMediaUseCase.js';

export interface MediaModuleContainer {
  uploadMediaUseCase: UploadMediaUseCase;
  getMediaAssetUseCase: GetMediaAssetUseCase;
  resolveMediaUrlUseCase: ResolveMediaUrlUseCase;
  collectOrphanedMediaUseCase: CollectOrphanedMediaUseCase;
}

export function createMediaModule(env: Env): MediaModuleContainer {
  const storagePort = new R2MediaStorageAdapter(env.MEDIA_BUCKET);
  const assetRepo = new D1MediaAssetRepository(env.DB);
  const imageProcessor = new CloudflareImageProcessor(env.IMAGES);

  return {
    uploadMediaUseCase: new UploadMediaUseCase(storagePort, assetRepo, imageProcessor),
    getMediaAssetUseCase: new GetMediaAssetUseCase(storagePort, assetRepo),
    resolveMediaUrlUseCase: new ResolveMediaUrlUseCase(assetRepo),
    collectOrphanedMediaUseCase: new CollectOrphanedMediaUseCase(storagePort, assetRepo),
  };
}

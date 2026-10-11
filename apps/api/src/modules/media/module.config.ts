import { Env } from '../../platform/Env.js';
import { R2MediaStorageAdapter } from './infrastructure/storage/r2/R2MediaStorageAdapter.js';
import { D1MediaAssetRepository } from './infrastructure/persistence/d1/repositories/D1MediaAssetRepository.js';
import { UploadMediaUseCase } from './application/use-cases/UploadMediaUseCase.js';
import { GetMediaAssetUseCase } from './application/use-cases/GetMediaAssetUseCase.js';
import { ResolveMediaUrlUseCase } from './application/use-cases/ResolveMediaUrlUseCase.js';

export interface MediaModuleContainer {
  uploadMediaUseCase: UploadMediaUseCase;
  getMediaAssetUseCase: GetMediaAssetUseCase;
  resolveMediaUrlUseCase: ResolveMediaUrlUseCase;
}

export function createMediaModule(env: Env): MediaModuleContainer {
  const storagePort = new R2MediaStorageAdapter(env.BUCKET);
  const assetRepo = new D1MediaAssetRepository(env.DB);

  return {
    uploadMediaUseCase: new UploadMediaUseCase(storagePort, assetRepo),
    getMediaAssetUseCase: new GetMediaAssetUseCase(storagePort, assetRepo),
    resolveMediaUrlUseCase: new ResolveMediaUrlUseCase(assetRepo),
  };
}

import { MediaAsset } from '../entities/MediaAsset.js';

export interface IMediaAssetRepository {
  findById(id: string): Promise<MediaAsset | null>;
  findByStorageKey(key: string): Promise<MediaAsset | null>;
  isStorageKeyReferenced(key: string): Promise<boolean>;
  save(asset: MediaAsset): Promise<void>;
  delete(id: string): Promise<void>;
  list(limit: number, offset: number, folderId?: string): Promise<MediaAsset[]>;
}

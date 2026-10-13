import { IMediaAssetRepository } from '../../domain/ports/IMediaAssetRepository.js';
import { IMediaStoragePort } from '../../domain/ports/IMediaStoragePort.js';

export class CollectOrphanedMediaUseCase {
  constructor(private readonly storage: IMediaStoragePort, private readonly assets: IMediaAssetRepository) {}

  public async execute(cursor?: string, now = new Date()): Promise<{ deleted: number; cursor?: string }> {
    const cutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const page = await this.storage.listPublicMedia(cursor, 100);
    let deleted = 0;
    for (const object of page.objects) {
      if (!object.key.startsWith('media/') || !Number.isFinite(Date.parse(object.uploadedAt)) || Date.parse(object.uploadedAt) > cutoff) continue;
      if (await this.assets.isStorageKeyReferenced(object.key)) continue;
      await this.storage.delete(object.key);
      deleted++;
    }
    return { deleted, cursor: page.cursor };
  }
}

import { Result } from '../../../../shared-kernel/Result.js';
import { IMediaStoragePort, StoredMediaObject } from '../../domain/ports/IMediaStoragePort.js';
import { IMediaAssetRepository } from '../../domain/ports/IMediaAssetRepository.js';

export interface ServeMediaOutput {
  stream: ReadableStream;
  mimeType: string;
  sizeBytes: number;
  altText: string;
}

export class GetMediaAssetUseCase {
  private readonly storagePort: IMediaStoragePort;
  private readonly assetRepo: IMediaAssetRepository;

  public constructor(storagePort: IMediaStoragePort, assetRepo: IMediaAssetRepository) {
    this.storagePort = storagePort;
    this.assetRepo = assetRepo;
  }

  public async execute(assetId: string): Promise<Result<ServeMediaOutput, Error>> {
    const asset = await this.assetRepo.findById(assetId);
    if (!asset) {
      return Result.fail(new Error('Archivo no encontrado'));
    }

    if (asset.isPrivate) {
      return Result.fail(new Error('Acceso no autorizado a archivo privado'));
    }

    const stored = await this.storagePort.get(asset.storageKey);
    if (!stored) {
      return Result.fail(new Error('Objeto no encontrado en almacenamiento'));
    }

    return Result.ok({
      stream: stored.stream,
      mimeType: asset.mimeType,
      sizeBytes: asset.fileSizeBytes,
      altText: asset.altText,
    });
  }
}

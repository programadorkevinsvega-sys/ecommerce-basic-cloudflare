import { Result } from '../../../../shared-kernel/Result.js';
import { IMediaAssetRepository } from '../../domain/ports/IMediaAssetRepository.js';

export interface MediaAssetDto {
  id: string;
  storageKey: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  altText: string;
  publicUrl: string;
  createdAt: string;
}

export class ResolveMediaUrlUseCase {
  private readonly assetRepo: IMediaAssetRepository;

  public constructor(assetRepo: IMediaAssetRepository) {
    this.assetRepo = assetRepo;
  }

  public async execute(mediaId: string): Promise<Result<MediaAssetDto, Error>> {
    const asset = await this.assetRepo.findById(mediaId);
    if (!asset) {
      return Result.fail(new Error('Recurso multimedia no encontrado'));
    }
    if (asset.isPrivate) return Result.fail(new Error('Recurso multimedia no encontrado'));

    return Result.ok({
      id: asset.id,
      storageKey: asset.storageKey,
      originalFileName: asset.originalFileName,
      mimeType: asset.mimeType,
      fileSizeBytes: asset.fileSizeBytes,
      altText: asset.altText,
      publicUrl: `/media/${asset.id}`,
      createdAt: asset.createdAt,
    });
  }
}

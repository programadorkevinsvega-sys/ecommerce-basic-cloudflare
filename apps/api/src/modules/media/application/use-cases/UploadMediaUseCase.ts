import { Result } from '../../../../shared-kernel/Result.js';
import { MediaAsset } from '../../domain/entities/MediaAsset.js';
import { ImageValidator } from '../../domain/services/ImageValidator.js';
import { IMediaStoragePort } from '../../domain/ports/IMediaStoragePort.js';
import { IMediaAssetRepository } from '../../domain/ports/IMediaAssetRepository.js';

export interface UploadMediaInput {
  originalFileName: string;
  data: Uint8Array;
  altText: string;
  folderId?: string;
  isPrivate?: boolean;
  uploadedByAdminId: string;
}

export interface UploadMediaOutput {
  id: string;
  storageKey: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  altText: string;
  publicUrl: string;
}

export class UploadMediaUseCase {
  private readonly storagePort: IMediaStoragePort;
  private readonly assetRepo: IMediaAssetRepository;

  public constructor(storagePort: IMediaStoragePort, assetRepo: IMediaAssetRepository) {
    this.storagePort = storagePort;
    this.assetRepo = assetRepo;
  }

  public async execute(input: UploadMediaInput): Promise<Result<UploadMediaOutput, Error>> {
    if (!input.altText || input.altText.trim().length === 0) {
      return Result.fail(new Error('El texto alternativo (altText) es obligatorio conforme a SEC-R2-04'));
    }

    if (input.data.length > ImageValidator.MAX_FILE_SIZE_BYTES) {
      return Result.fail(new Error('El archivo excede el tamaño máximo permitido de 10 MB'));
    }

    const validation = ImageValidator.validateMagicBytes(input.data);
    if (!validation.isValid || !validation.detectedMimeType) {
      return Result.fail(new Error(validation.error || 'Formato de imagen inválido'));
    }
    if (input.altText.trim().length > 500 || input.originalFileName.length > 255 || /[\u0000-\u001f]/.test(input.originalFileName)) {
      return Result.fail(new Error('Metadatos del archivo inválidos'));
    }
    const extensionMime: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif' };
    const extension = input.originalFileName.split('.').pop()?.toLowerCase();
    if (extension && extensionMime[extension] && extensionMime[extension] !== validation.detectedMimeType) {
      return Result.fail(new Error('La extensión del archivo no coincide con su contenido'));
    }

    const assetId = crypto.randomUUID();
    const isPrivate = Boolean(input.isPrivate);
    // SEC-R2-03: clave generada en servidor sin nombre original
    const storageKey = isPrivate
      ? `private/admin/${input.uploadedByAdminId}/${assetId}`
      : `media/${assetId}`;

    const storedSize = await this.storagePort.put(storageKey, input.data, validation.detectedMimeType);
    if (storedSize !== input.data.length) {
      await this.storagePort.delete(storageKey);
      return Result.fail(new Error('El objeto almacenado no coincide con el archivo validado'));
    }

    const now = new Date().toISOString();
    const asset = new MediaAsset({
      id: assetId,
      storageKey,
      originalFileName: input.originalFileName,
      mimeType: validation.detectedMimeType,
      fileSizeBytes: input.data.length,
      altText: input.altText.trim(),
      folderId: input.folderId,
      isPrivate,
      uploadedByAdminId: input.uploadedByAdminId,
      createdAt: now,
      updatedAt: now,
    });

    try {
      await this.assetRepo.save(asset);
    } catch {
      // La clave es nueva y no se publicó la referencia en D1.
      await this.storagePort.delete(storageKey).catch(() => undefined);
      throw new Error('No se pudo registrar el archivo');
    }

    return Result.ok({
      id: asset.id,
      storageKey: asset.storageKey,
      originalFileName: asset.originalFileName,
      mimeType: asset.mimeType,
      fileSizeBytes: asset.fileSizeBytes,
      altText: asset.altText,
      publicUrl: `/media/${asset.id}`,
    });
  }
}

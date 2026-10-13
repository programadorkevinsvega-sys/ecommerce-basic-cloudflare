import { IMediaStoragePort, StoredMediaObject } from '../../../domain/ports/IMediaStoragePort.js';

export class R2MediaStorageAdapter implements IMediaStoragePort {
  private readonly bucket: R2Bucket;

  public constructor(bucket: R2Bucket) {
    this.bucket = bucket;
  }

  public async put(key: string, data: Uint8Array | ReadableStream, mimeType: string): Promise<number> {
    const object = await this.bucket.put(key, data, {
      httpMetadata: {
        contentType: mimeType,
      },
    });
    return object.size;
  }

  public async get(key: string): Promise<StoredMediaObject | null> {
    const object = await this.bucket.get(key);
    if (!object) {
      return null;
    }

    return {
      stream: object.body,
      mimeType: object.httpMetadata?.contentType || 'application/octet-stream',
      sizeBytes: object.size,
    };
  }

  public async delete(key: string): Promise<void> {
    await this.bucket.delete(key);
  }
}

export interface StoredMediaObject {
  stream: ReadableStream;
  mimeType: string;
  sizeBytes: number;
}

export interface IMediaStoragePort {
  put(key: string, data: Uint8Array | ReadableStream, mimeType: string): Promise<number>;
  get(key: string): Promise<StoredMediaObject | null>;
  delete(key: string): Promise<void>;
}

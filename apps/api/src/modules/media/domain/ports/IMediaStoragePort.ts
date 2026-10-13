export interface StoredMediaObject {
  stream: ReadableStream;
  mimeType: string;
  sizeBytes: number;
}

export interface IMediaStoragePort {
  put(key: string, data: Uint8Array | ReadableStream, mimeType: string): Promise<number>;
  head(key: string): Promise<{ sizeBytes: number } | null>;
  get(key: string): Promise<StoredMediaObject | null>;
  delete(key: string): Promise<void>;
}

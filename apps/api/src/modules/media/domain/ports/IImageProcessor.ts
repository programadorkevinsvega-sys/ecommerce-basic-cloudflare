export interface ProcessedImage {
  data: Uint8Array;
  mimeType: 'image/webp';
  width: number;
  height: number;
}

export interface IImageProcessor {
  decodeAndSanitize(data: Uint8Array, expectedMimeType: string): Promise<ProcessedImage>;
}

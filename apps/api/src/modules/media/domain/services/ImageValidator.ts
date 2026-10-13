import { parseImageHeader } from './ParseImageHeader.js';

export interface ImageMagicValidationResult {
  isValid: boolean;
  detectedMimeType?: string;
  width?: number;
  height?: number;
  error?: string;
}

export class ImageValidator {
  public static readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  public static readonly MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
  public static readonly MAX_DIMENSION = 16_384;
  public static readonly MAX_PIXEL_COUNT = 40_000_000;

  public static validateMagicBytes(bytes: Uint8Array): ImageMagicValidationResult {
    if (bytes.length < 20) return { isValid: false, error: 'El archivo es demasiado pequeño para ser una imagen válida' };
    const image = parseImageHeader(bytes);
    if (!image || !Number.isSafeInteger(image.width) || !Number.isSafeInteger(image.height) || image.width < 1 || image.height < 1) {
      return { isValid: false, error: 'Imagen truncada, malformada o con dimensiones inválidas' };
    }
    if (image.width > this.MAX_DIMENSION || image.height > this.MAX_DIMENSION || image.width * image.height > this.MAX_PIXEL_COUNT) {
      return { isValid: false, error: 'La imagen supera el límite de 16.384 px por lado o 40 megapíxeles' };
    }
    return { isValid: true, detectedMimeType: image.mimeType, width: image.width, height: image.height };
  }
}

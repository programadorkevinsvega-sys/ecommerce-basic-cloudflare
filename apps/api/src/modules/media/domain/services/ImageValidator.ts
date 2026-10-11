export interface ImageMagicValidationResult {
  isValid: boolean;
  detectedMimeType?: string;
  error?: string;
}

export class ImageValidator {
  public static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
  ];

  public static readonly MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

  public static validateMagicBytes(bytes: Uint8Array): ImageMagicValidationResult {
    if (bytes.length < 12) {
      return { isValid: false, error: 'El archivo es demasiado pequeño para ser una imagen válida' };
    }

    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return { isValid: true, detectedMimeType: 'image/jpeg' };
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return { isValid: true, detectedMimeType: 'image/png' };
    }

    // WebP: 52 49 46 46 (RIFF) .... 57 45 42 50 (WEBP)
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return { isValid: true, detectedMimeType: 'image/webp' };
    }

    // AVIF: .... 66 74 79 70 61 76 69 66 (ftypavif)
    if (
      bytes[4] === 0x66 &&
      bytes[5] === 0x74 &&
      bytes[6] === 0x79 &&
      bytes[7] === 0x70 &&
      bytes[8] === 0x61 &&
      bytes[9] === 0x76 &&
      bytes[10] === 0x69 &&
      bytes[11] === 0x66
    ) {
      return { isValid: true, detectedMimeType: 'image/avif' };
    }

    return {
      isValid: false,
      error: 'Formato no permitido: solo se admiten imágenes JPEG, PNG, WebP o AVIF verificadas por firma real',
    };
  }
}

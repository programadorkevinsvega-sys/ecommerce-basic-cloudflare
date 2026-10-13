import { IImageProcessor, ProcessedImage } from '../../domain/ports/IImageProcessor.js';

export class CloudflareImageProcessor implements IImageProcessor {
  constructor(private readonly images: ImagesBinding) {}

  public async decodeAndSanitize(data: Uint8Array, expectedMimeType: string): Promise<ProcessedImage> {
    const input = new Response(data).body;
    if (!input) throw new Error('No fue posible leer la imagen');
    const info = await this.images.info(input);
    if (!('width' in info) || !('height' in info) || !info.width || !info.height || info.format === 'image/svg+xml') throw new Error('Formato de imagen no rasterizado');
    if (info.format !== expectedMimeType) throw new Error('El formato decodificado no coincide con el encabezado');
    const width = info.width;
    const height = info.height;
    if (width > 16_384 || height > 16_384 || width * height > 40_000_000) throw new Error('Límites de imagen excedidos');
    const source = new Response(data).body;
    if (!source) throw new Error('No fue posible leer la imagen');
    const output = await this.images.input(source).output({ format: 'image/webp', quality: 90, anim: false });
    const reader = output.image().getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 10 * 1024 * 1024) { await reader.cancel(); throw new Error('Imagen procesada excede 10 MB'); }
      chunks.push(value);
    }
    const result = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
    return { data: result, mimeType: 'image/webp', width, height };
  }
}

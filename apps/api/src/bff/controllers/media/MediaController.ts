import { Hono } from 'hono';
import { MediaGateway } from '../../gateways/media/MediaGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';
import { bodyLimit } from 'hono/body-limit';
import { JsonLogger } from '../../../platform/JsonLogger.js';

type MediaVariables = {
  Variables: {
    actorId: string;
    actorType: string;
    permissions: string[];
  };
};

export class MediaController {
  public static createRoutes(mediaGateway: MediaGateway, identityGateway: IdentityGateway): Hono<MediaVariables> {
    const router = new Hono<MediaVariables>();
    const logger = new JsonLogger('media');

    // SEC-R2-01 & SEC-R2-06: Servir medios a través del Worker con X-Content-Type-Options: nosniff
    router.get('/:id', async (c) => {
      const assetId = c.req.param('id');
      const cacheKey = new Request(new URL(`/media/${encodeURIComponent(assetId)}`, c.req.url));
      try {
        const cached = await caches.default.match(cacheKey);
        if (cached) return cached;
      } catch (error) {
        logger.warn('No fue posible consultar el caché edge de media', { assetId, errorName: error instanceof Error ? error.name : 'UnknownError' });
      }

      try {
        const media = await mediaGateway.getMedia(assetId);
        const response = new Response(media.stream, {
          status: 200,
          headers: {
            'Content-Type': media.mimeType,
            'Content-Length': media.sizeBytes.toString(),
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
        try {
          await caches.default.put(cacheKey, response.clone());
        } catch (error) {
          logger.warn('No fue posible guardar media pública en el caché edge', { assetId, errorName: error instanceof Error ? error.name : 'UnknownError' });
        }
        return response;
      } catch {
        return c.json({ error: 'Recurso no encontrado' }, 404);
      }
    });

    // SEC-R2-04 & SEC-ADM-01: Solo admin con permiso media:create puede subir medios
    router.post(
      '/upload',
      createAuthMiddleware(identityGateway, 'admin', 'media:create'),
      bodyLimit({ maxSize: 11 * 1024 * 1024, onError: (c) => c.json({ error: 'La solicitud supera el límite de 11 MB' }, 413) }),
      async (c) => {
        try {
          const contentLength = Number(c.req.header('content-length') || 0);
          if (contentLength > 11 * 1024 * 1024) return c.json({ error: 'La solicitud supera el límite de 11 MB' }, 413);
          const body = await c.req.parseBody();
          const file = body['file'];
          const altText = body['altText'];
          const isPrivate = body['isPrivate'] === 'true';
          const adminId = c.get('actorId') as string;

          if (!file || !(file instanceof File)) {
            return c.json({ error: 'Archivo no proporcionado o inválido' }, 400);
          }
          if (file.size < 12 || file.size > 10 * 1024 * 1024) return c.json({ error: 'La imagen debe pesar entre 12 bytes y 10 MB' }, 413);

          if (typeof altText !== 'string' || altText.trim().length === 0) {
            return c.json({ error: 'El texto alternativo (altText) es obligatorio' }, 400);
          }

          const arrayBuffer = await file.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);

          const result = await mediaGateway.uploadMedia({
            originalFileName: file.name,
            data: bytes,
            altText,
            isPrivate,
            uploadedByAdminId: adminId,
          });

          return c.json({ data: {
            id: result.id,
            originalFileName: result.originalFileName,
            mimeType: result.mimeType,
            fileSizeBytes: result.fileSizeBytes,
            altText: result.altText,
            publicUrl: result.publicUrl,
          } }, 201);
        } catch {
          return c.json({ error: 'No fue posible procesar la imagen' }, 400);
        }
      }
    );

    return router;
  }
}

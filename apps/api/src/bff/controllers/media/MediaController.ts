import { Hono } from 'hono';
import { MediaGateway } from '../../gateways/media/MediaGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';

export class MediaController {
  public static createRoutes(mediaGateway: MediaGateway, identityGateway: IdentityGateway): Hono {
    const router = new Hono();

    // SEC-R2-01 & SEC-R2-06: Servir medios a través del Worker con X-Content-Type-Options: nosniff
    router.get('/:id', async (c) => {
      const assetId = c.req.param('id');
      try {
        const media = await mediaGateway.getMedia(assetId);
        return new Response(media.stream, {
          status: 200,
          headers: {
            'Content-Type': media.mimeType,
            'Content-Length': media.sizeBytes.toString(),
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      } catch {
        return c.json({ error: 'Recurso no encontrado' }, 404);
      }
    });

    // SEC-R2-04 & SEC-ADM-01: Solo admin con permiso media:create puede subir medios
    router.post(
      '/upload',
      createAuthMiddleware(identityGateway, 'admin', 'media:create'),
      async (c) => {
        try {
          const body = await c.req.parseBody();
          const file = body['file'];
          const altText = body['altText'];
          const isPrivate = body['isPrivate'] === 'true';
          const adminId = c.get('actorId') as string;

          if (!file || !(file instanceof File)) {
            return c.json({ error: 'Archivo no proporcionado o inválido' }, 400);
          }

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

          return c.json({ data: result }, 201);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Error al procesar subida';
          return c.json({ error: msg }, 400);
        }
      }
    );

    return router;
  }
}

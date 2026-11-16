import { Hono } from 'hono';
import { MediaGateway } from '../../gateways/media/MediaGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';
import { bodyLimit } from 'hono/body-limit';
import { JsonLogger } from '../../../platform/JsonLogger.js';
import { captureSentryException } from '../../../platform/captureSentryException.js';
import { createAdminCountryAccessMiddleware } from '../../middleware/AdminCountryAccessMiddleware.js';

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
      createAdminCountryAccessMiddleware(identityGateway),
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
        } catch (error) {
          const message = error instanceof Error ? error.message : '';
          const validationMessage = MEDIA_VALIDATION_ERRORS.has(message) ? message : undefined;
          if (validationMessage) {
            return c.json({ error: validationMessage, errorCode: 'MEDIA_UPLOAD_INVALID' }, 400);
          }

          const failure = mediaFailure(message);
          const traceContext = c.get('traceContext');
          new JsonLogger('media', traceContext).error('Media upload failed', error, {
            failure_reason: failure.reason,
          });
          captureSentryException(error, {
            area: 'media', reason: failure.reason,
            traceId: traceContext?.traceId, requestId: traceContext?.requestId,
          });
          return c.json({
            error: failure.message,
            errorCode: failure.code,
            traceId: traceContext?.traceId || 'unknown',
          }, 503);
        }
      }
    );

    return router;
  }
}

const MEDIA_VALIDATION_ERRORS = new Set([
  'El texto alternativo (altText) es obligatorio conforme a SEC-R2-04',
  'El archivo excede el tamaño máximo permitido de 10 MB',
  'El archivo es demasiado pequeño para ser una imagen válida',
  'Imagen truncada, malformada o con dimensiones inválidas',
  'La imagen supera el límite de 16.384 px por lado o 40 megapíxeles',
  'Formato de imagen inválido',
  'Metadatos del archivo inválidos',
  'La extensión del archivo no coincide con su contenido',
  'La imagen no pudo decodificarse o procesarse de forma segura',
]);

function mediaFailure(message: string): { code: string; reason: string; message: string } {
  if (message === 'No se pudo verificar el objeto almacenado') {
    return {
      code: 'MEDIA_STORAGE_VERIFICATION_FAILED',
      reason: 'media_storage_verification_failed',
      message: 'No se pudo confirmar la imagen en el almacenamiento. Intenta de nuevo.',
    };
  }
  if (message === 'No se pudo registrar el archivo') {
    return {
      code: 'MEDIA_METADATA_REGISTRATION_FAILED',
      reason: 'media_metadata_registration_failed',
      message: 'La imagen se procesó, pero no se pudo registrar. Intenta de nuevo.',
    };
  }
  return {
    code: 'MEDIA_UPLOAD_FAILED',
    reason: 'media_upload_failed',
    message: 'No se pudo completar la carga de la imagen. Intenta de nuevo.',
  };
}

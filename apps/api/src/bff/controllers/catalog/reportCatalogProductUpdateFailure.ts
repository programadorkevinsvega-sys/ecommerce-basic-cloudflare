import { JsonLogger } from '../../../platform/JsonLogger.js';
import { captureSentryException } from '../../../platform/captureSentryException.js';
import type { TraceContext } from '../../../platform/TraceContext.js';

export function reportCatalogProductUpdateFailure(
  error: unknown,
  inventoryStockUpdated: boolean,
  traceContext?: TraceContext,
): { error: string; errorCode: string; traceId: string; status: 503 } {
  const failureReason = inventoryStockUpdated
    ? 'catalog_save_failed_after_inventory_update'
    : 'product_update_failed';
  new JsonLogger('catalog', traceContext).error('Catalog product update failed', error, {
    failure_reason: failureReason,
  });
  captureSentryException(error, {
    area: 'catalog', reason: failureReason,
    traceId: traceContext?.traceId, requestId: traceContext?.requestId,
  });
  if (inventoryStockUpdated) {
    return {
      error: 'El inventario operativo se actualizó, pero no se pudo guardar el producto en el catálogo. Reintenta guardar el producto; verifica primero el stock en Inventario.',
      errorCode: 'CATALOG_SAVE_FAILED_AFTER_INVENTORY_UPDATE',
      traceId: traceContext?.traceId || 'unknown',
      status: 503,
    };
  }
  return {
    error: 'No fue posible actualizar el producto por un fallo del servicio. Intenta de nuevo.',
    errorCode: 'PRODUCT_UPDATE_FAILED',
    traceId: traceContext?.traceId || 'unknown',
    status: 503,
  };
}

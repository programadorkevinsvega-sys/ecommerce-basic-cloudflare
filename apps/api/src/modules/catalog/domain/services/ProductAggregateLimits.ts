export const MAX_PRODUCT_RELATION_ITEMS = 30;
export const MAX_PRODUCT_RELATION_WRITES = 90;
export const MAX_PRODUCT_BATCH_STATEMENTS = 100;
export const MAX_PRODUCT_AGGREGATE_BYTES = 256 * 1024;

export function validateProductRelationships(input: {
  categoryIds?: string[];
  mediaIds?: string[];
  localCoverageZones?: string[];
}): Error | null {
  const groups = [input.categoryIds ?? [], input.mediaIds ?? [], input.localCoverageZones ?? []];
  if (groups.some((items) => items.length > MAX_PRODUCT_RELATION_ITEMS)) {
    return new Error(`Cada producto admite como máximo ${MAX_PRODUCT_RELATION_ITEMS} relaciones por tipo`);
  }
  if (groups.reduce((total, items) => total + items.length, 0) > MAX_PRODUCT_RELATION_WRITES) {
    return new Error('El agregado del producto excede el límite de relaciones D1');
  }
  for (const items of groups) {
    if (items.some((id) => typeof id !== 'string' || id.length === 0 || id.length > 120)) {
      return new Error('Un identificador de relación del producto no es válido');
    }
    if (new Set(items).size !== items.length) {
      return new Error('El producto contiene identificadores de relación duplicados');
    }
  }
  return null;
}

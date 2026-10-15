import { PUBLIC_HTML_CACHE_TAG } from './PublicHtmlCacheTag.js';

export interface WorkerCachePurgePort {
  purge(options: { tags: string[] }): Promise<{ success: boolean; errors: Array<{ code: number }> }>;
}

export async function purgePublicHtmlCache(cache: WorkerCachePurgePort | undefined): Promise<void> {
  if (!cache) throw new Error('Workers Cache purge is unavailable');
  const result = await cache.purge({ tags: [PUBLIC_HTML_CACHE_TAG] });
  if (!result.success) throw new Error(`Workers Cache purge failed (${result.errors.length} errors)`);
}

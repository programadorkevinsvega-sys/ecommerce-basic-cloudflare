import { CmsBlock } from './entities/Page.js';
import { sanitizeHtml } from './sanitizeHtml.js';
import { sanitizeCmsImageUrl, sanitizeCmsLink } from './sanitizeCmsUrl.js';

export function sanitizeCmsBlocks(blocks: CmsBlock[]): CmsBlock[] {
  return blocks.flatMap((block) => {
    const content = { ...block.content };
    if (typeof content['html'] === 'string') content['html'] = sanitizeHtml(content['html']);
    const url = content['url'];
    if (typeof url === 'string') {
      if (block.type === 'image') {
        const imageUrl = sanitizeCmsImageUrl(url);
        if (!imageUrl) return [];
        content['url'] = imageUrl;
      }
      if (block.type === 'cta') content['url'] = sanitizeCmsLink(url) || '/';
    }
    return [{ ...block, content }];
  });
}
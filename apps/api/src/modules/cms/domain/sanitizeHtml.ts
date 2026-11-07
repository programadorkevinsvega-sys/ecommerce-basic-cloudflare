import xss from 'xss';
import type { IFilterXSSOptions } from 'xss';
import { sanitizeCmsImageUrl, sanitizeCmsLink } from './sanitizeCmsUrl.js';

const options: IFilterXSSOptions = {
  whiteList: {
    a: [], b: [], blockquote: [], br: [], caption: [], code: [],
    dd: [], div: [], dl: [], dt: [], em: [], figcaption: [], figure: [],
    h1: [], h2: [], h3: [], h4: [], hr: [], i: [], img: ['alt', 'height', 'loading', 'width'],
    li: [], ol: [], p: [], pre: [], s: [], small: [], span: [], strong: [],
    sub: [], sup: [], table: [], tbody: [], td: ['colspan', 'rowspan'],
    tfoot: [], th: ['colspan', 'rowspan'], thead: [], tr: [], u: [], ul: [],
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['applet', 'embed', 'form', 'iframe', 'math', 'noembed', 'noframes', 'noscript', 'object', 'script', 'style', 'svg', 'template', 'textarea'],
  css: false,
  onIgnoreTagAttr: (tag, name, value) => {
    const cleanValue = tag === 'a' && name === 'href' ? sanitizeCmsLink(value)
      : tag === 'img' && name === 'src' ? sanitizeCmsImageUrl(value) : '';
    if (!cleanValue) return;
    return `${name}="${escapeAttribute(cleanValue)}"`;
  },
};

export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';
  return xss(dirty, options).trim();
}

function escapeAttribute(value: string): string {
  return value.replace(/[&"<>']/g, (char) => ({
    '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;', "'": '&#039;',
  })[char] || char);
}

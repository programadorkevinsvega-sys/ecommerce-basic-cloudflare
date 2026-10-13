import { CmsBlockDto } from '../gateways/cms/CmsGateway.js';

export function renderCmsBlocks(blocks: CmsBlockDto[]): string {
  const sorted = [...blocks].sort((a, b) => a.sortOrder - b.sortOrder);

  return sorted.map((b) => {
    switch (b.type) {
      case 'rich_text': {
        const rawHtml = b.content['html'];
        if (typeof rawHtml === 'string' && rawHtml.trim()) {
          return `<div class="cms-block cms-rich-text" style="margin-bottom: 2rem; font-size: 1.05rem; line-height: 1.7;">${rawHtml}</div>`;
        }
        return `<div class="cms-block cms-rich-text" style="margin-bottom: 2rem; font-size: 1.05rem; line-height: 1.7;">${escapeHtml(String(b.content['text'] || ''))}</div>`;
      }

      case 'image':
        return `
          <div class="cms-block cms-image" style="margin-bottom: 2rem; text-align: center;">
            <img src="${escapeHtml(String(b.content['url'] || ''))}" alt="${escapeHtml(String(b.content['alt'] || ''))}" style="max-width: 100%; border-radius: 8px; border: 1px solid var(--border);" loading="lazy" />
            ${b.content['caption'] ? `<p style="font-size: 0.85rem; color: var(--muted); margin-top: 0.5rem;">${escapeHtml(String(b.content['caption']))}</p>` : ''}
          </div>
        `;

      case 'cta':
        return `
          <div class="cms-block cms-cta" style="margin: 2.5rem 0; padding: 2rem; background: var(--primary); color: #fff; border-radius: 8px; text-align: center;">
            <h3 style="font-size: 1.5rem; margin-bottom: 0.75rem;">${escapeHtml(String(b.content['title'] || ''))}</h3>
            <p style="color: #cbd5e1; margin-bottom: 1.25rem;">${escapeHtml(String(b.content['description'] || ''))}</p>
            <a href="${escapeHtml(String(b.content['url'] || '/'))}" style="display: inline-block; padding: 0.75rem 1.5rem; background: var(--accent); color: #fff; text-decoration: none; border-radius: 6px; font-weight: 700;">${escapeHtml(String(b.content['buttonText'] || 'Ver más'))}</a>
          </div>
        `;

      case 'faq':
        const questions = Array.isArray(b.content['items']) ? b.content['items'] : [];
        return `
          <div class="cms-block cms-faq" style="margin-bottom: 2rem;">
            <h3 style="font-size: 1.3rem; margin-bottom: 1rem;">Preguntas Frecuentes</h3>
            ${questions.map((q: any) => `
              <div style="margin-bottom: 1rem; padding: 1rem; background: var(--card); border: 1px solid var(--border); border-radius: 6px;">
                <h4 style="font-size: 1.05rem; margin-bottom: 0.5rem; color: var(--accent);">${escapeHtml(String(q.question || ''))}</h4>
                <p style="color: var(--text);">${escapeHtml(String(q.answer || ''))}</p>
              </div>
            `).join('')}
          </div>
        `;

      default:
        return `<div class="cms-block" style="margin-bottom: 1rem;">${escapeHtml(String(b.content['text'] || ''))}</div>`;
    }
  }).join('');
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

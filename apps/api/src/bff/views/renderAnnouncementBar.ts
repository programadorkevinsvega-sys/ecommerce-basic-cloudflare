export interface AnnouncementBarItem {
  message: string;
  linkUrl?: string;
}

export function renderAnnouncementBar(items: AnnouncementBarItem[]): string {
  const announcements = items.filter((item) => item.message.trim());
  if (!announcements.length) return '';
  const slides = announcements.map((item, index) => `
    <div class="announcement-slide" data-announcement-slide${index ? ' hidden' : ''}>
      <span>${escapeHtml(item.message)}</span>${item.linkUrl ? `<a href="${escapeHtml(item.linkUrl)}">Ver más →</a>` : ''}
    </div>`).join('');
  const controls = announcements.length > 1 ? `<div class="announcement-controls" aria-label="Controles de anuncios">
    <button type="button" data-announcement-step="-1" aria-label="Anuncio anterior">‹</button>
    <button type="button" data-announcement-pause aria-label="Pausar anuncios" aria-pressed="false">Pausar</button>
    <button type="button" data-announcement-step="1" aria-label="Siguiente anuncio">›</button>
  </div>` : '';
  const script = announcements.length > 1 ? `<script>(()=>{
    const bar=document.querySelector('[data-announcement-rotator]');
    if(!bar)return;
    const slides=[...bar.querySelectorAll('[data-announcement-slide]')];
    const pause=bar.querySelector('[data-announcement-pause]');
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let index=0, paused=false, timer;
    const show=(next)=>{index=(next+slides.length)%slides.length;slides.forEach((slide,i)=>{slide.hidden=i!==index;});};
    const sync=()=>{window.clearInterval(timer);pause.textContent=paused?'Reanudar':'Pausar';pause.setAttribute('aria-label',paused?'Reanudar anuncios':'Pausar anuncios');pause.setAttribute('aria-pressed',String(paused));if(!reduced&&!paused&&!document.hidden)timer=window.setInterval(()=>show(index+1),6000);};
    bar.querySelectorAll('[data-announcement-step]').forEach(button=>button.addEventListener('click',()=>{show(index+Number(button.dataset.announcementStep));sync();}));
    pause.addEventListener('click',()=>{paused=!paused;sync();});
    bar.addEventListener('mouseenter',()=>{window.clearInterval(timer);});
    bar.addEventListener('mouseleave',sync);
    bar.addEventListener('focusin',()=>window.clearInterval(timer));
    bar.addEventListener('focusout',sync);
    document.addEventListener('visibilitychange',sync);
    sync();
  })();</script>` : '';
  return `<div class="announcement-bar${announcements.length > 1 ? ' announcement-bar-rotator' : ''}"${announcements.length > 1 ? ' data-announcement-rotator' : ''}>
    <div class="announcement-slides" aria-live="polite">${slides}</div>${controls}
  </div>${script}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char);
}

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
  const script = announcements.length > 1 ? `<script>(()=>{
    const bar=document.querySelector('[data-announcement-rotator]');
    if(!bar)return;
    const slides=[...bar.querySelectorAll('[data-announcement-slide]')];
    let index=0,timer;
    const show=(next)=>{index=(next+slides.length)%slides.length;slides.forEach((slide,i)=>{slide.hidden=i!==index;});};
    const play=()=>{window.clearInterval(timer);if(!document.hidden)timer=window.setInterval(()=>show(index+1),6000);};
    document.addEventListener('visibilitychange',play);
    play();
  })();</script>` : '';
  return `<div class="announcement-bar${announcements.length > 1 ? ' announcement-bar-rotator' : ''}"${announcements.length > 1 ? ' data-announcement-rotator' : ''}>
    <div class="announcement-slides" aria-live="off">${slides}</div>
  </div>${script}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char);
}

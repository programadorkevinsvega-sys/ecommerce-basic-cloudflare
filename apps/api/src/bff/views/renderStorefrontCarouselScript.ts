export function renderStorefrontCarouselScript(carouselId: string): string {
  const id = JSON.stringify(carouselId);
  return `<script>(() => {
    const carousel = document.getElementById(${id});
    const controls = carousel?.parentElement?.querySelector('.campaign-carousel-controls');
    if (!carousel || !controls) return;
    const slides = carousel.querySelectorAll(':scope > .campaign-banner');
    if (slides.length < 2) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pauseButton = controls.querySelector('[data-carousel-pause]');
    let manuallyPaused = false;
    let timer;
    const syncPlayback = () => {
      window.clearInterval(timer);
      pauseButton.hidden = reducedMotion;
      pauseButton.textContent = manuallyPaused ? 'Reanudar' : 'Pausar';
      pauseButton.setAttribute('aria-label', manuallyPaused ? 'Reanudar carrusel automático' : 'Pausar carrusel automático');
      pauseButton.setAttribute('aria-pressed', String(manuallyPaused));
      if (!manuallyPaused && !document.hidden) timer = window.setInterval(() => move(1), 6000);
    };
    const move = direction => {
      const currentIndex = Math.round(carousel.scrollLeft / carousel.clientWidth);
      const nextIndex = (currentIndex + direction + slides.length) % slides.length;
      carousel.scrollTo({ left: nextIndex * carousel.clientWidth, behavior: reducedMotion ? 'instant' : 'smooth' });
    };
    controls.querySelectorAll('[data-carousel-direction]').forEach(button => button.addEventListener('click', () => move(Number(button.dataset.carouselDirection))));
    pauseButton.addEventListener('click', () => { manuallyPaused = !manuallyPaused; syncPlayback(); });
    carousel.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      move(event.key === 'ArrowLeft' ? -1 : 1);
    });
    document.addEventListener('visibilitychange', syncPlayback);
    syncPlayback();
  })();</script>`;
}

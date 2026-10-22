export function renderSearchSuggestionsScript(): string {
  return String.raw\`<script>
    (() => {
      const form = document.querySelector('.header-search');
      const input = document.getElementById('header-search');
      const list = document.getElementById('header-search-suggestions');
      if (!(form instanceof HTMLFormElement) || !(input instanceof HTMLInputElement) || !(list instanceof HTMLUListElement)) return;

      let debounceTimer = 0;
      let activeRequest = null;
      let requestSequence = 0;
      let activeIndex = -1;

      const options = () => Array.from(list.querySelectorAll('[role="option"]'));
      const hide = () => {
        list.hidden = true;
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
        activeIndex = -1;
        options().forEach((option) => option.setAttribute('aria-selected', 'false'));
      };
      const formatPrice = (cents) => (Number(cents) / 100).toLocaleString('es-CO', {
        style: 'currency', currency: 'COP', maximumFractionDigits: 0,
      });

      const setActive = (nextIndex) => {
        const items = options();
        if (!items.length) return;
        activeIndex = (nextIndex + items.length) % items.length;
        items.forEach((option, index) => option.setAttribute('aria-selected', String(index === activeIndex)));
        input.setAttribute('aria-activedescendant', items[activeIndex].id);
        items[activeIndex].scrollIntoView({ block: 'nearest' });
      };

      const render = (items) => {
        list.replaceChildren();
        activeIndex = -1;
        for (const item of items.slice(0, 6)) {
          if (!item || typeof item.slug !== 'string' || typeof item.name !== 'string') continue;
          const row = document.createElement('li');
          row.setAttribute('role', 'presentation');
          const link = document.createElement('a');
          link.id = 'header-search-option-' + options().length;
          link.className = 'header-search-suggestion';
          link.setAttribute('role', 'option');
          link.setAttribute('aria-selected', 'false');
          link.href = '/productos/' + encodeURIComponent(item.slug);

          if (typeof item.imageMediaId === 'string' && item.imageMediaId.length > 0) {
            const image = document.createElement('img');
            image.className = 'header-search-suggestion-image';
            image.src = '/media/' + encodeURIComponent(item.imageMediaId);
            image.alt = '';
            image.loading = 'lazy';
            image.width = 48;
            image.height = 48;
            link.append(image);
          }

          const copy = document.createElement('span');
          copy.className = 'header-search-suggestion-copy';
          const title = document.createElement('span');
          title.className = 'header-search-suggestion-title';
          title.textContent = item.name;
          const meta = document.createElement('span');
          meta.className = 'header-search-suggestion-meta';
          const brand = typeof item.brand === 'string' && item.brand.trim() ? item.brand.trim() : '';
          const price = Number.isSafeInteger(item.priceInCents) && item.priceInCents >= 0 ? formatPrice(item.priceInCents) : '';
          meta.textContent = [brand, price].filter(Boolean).join(' · ');
          copy.append(title);
          if (meta.textContent) copy.append(meta);
          link.append(copy);
          row.append(link);
          list.append(row);
        }

        if (!list.children.length) {
          hide();
          return;
        }
        list.hidden = false;
        input.setAttribute('aria-expanded', 'true');
      };

      const search = async (query, sequence) => {
        activeRequest?.abort();
        const controller = new AbortController();
        activeRequest = controller;
        input.setAttribute('aria-busy', 'true');
        try {
          const response = await fetch('/api/v1/search/suggestions?q=' + encodeURIComponent(query), {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
          });
          if (!response.ok) throw new Error('Search suggestions unavailable');
          const payload = await response.json();
          if (sequence !== requestSequence || input.value.replace(/\\s+/g, ' ').trim() !== query) return;
          render(Array.isArray(payload.suggestions) ? payload.suggestions : []);
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') return;
          if (sequence === requestSequence) hide();
        } finally {
          if (sequence === requestSequence) input.removeAttribute('aria-busy');
        }
      };

      input.addEventListener('input', () => {
        window.clearTimeout(debounceTimer);
        activeRequest?.abort();
        const query = input.value.replace(/\\s+/g, ' ').trim();
        requestSequence += 1;
        const sequence = requestSequence;
        if (Array.from(query).length < 2) {
          hide();
          input.removeAttribute('aria-busy');
          return;
        }
        debounceTimer = window.setTimeout(() => { void search(query, sequence); }, 180);
      });

      input.addEventListener('keydown', (event) => {
        const items = options();
        if (event.key === 'Escape') {
          hide();
        } else if (!list.hidden && event.key === 'ArrowDown' && items.length) {
          event.preventDefault();
          setActive(activeIndex + 1);
        } else if (!list.hidden && event.key === 'ArrowUp' && items.length) {
          event.preventDefault();
          setActive(activeIndex < 0 ? items.length - 1 : activeIndex - 1);
        } else if (event.key === 'Enter' && !list.hidden && activeIndex >= 0 && items[activeIndex]) {
          event.preventDefault();
          items[activeIndex].click();
        } else if (event.key === 'Tab') {
          hide();
        }
      });

      list.addEventListener('pointermove', (event) => {
        const target = event.target instanceof Element ? event.target.closest('[role="option"]') : null;
        if (!target) return;
        const index = options().indexOf(target);
        if (index >= 0 && index !== activeIndex) setActive(index);
      });
      document.addEventListener('pointerdown', (event) => {
        if (event.target instanceof Node && !form.contains(event.target)) hide();
      });
      input.addEventListener('blur', () => {
        window.setTimeout(() => {
          if (!form.contains(document.activeElement)) hide();
        }, 120);
      });
      form.addEventListener('submit', hide);
    })();
  </script>\`;
}

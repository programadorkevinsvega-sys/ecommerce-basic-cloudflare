export function renderProductLandingEditorScript(): string {
  return `
    (() => {
      const modal = document.getElementById('product-landing-modal');
      const form = document.getElementById('productLandingForm');
      const msg = document.getElementById('plMsg');
      const closeButtons = document.querySelectorAll('[data-close-product-landing]');
      let activeProductId = '';
      let previousFocus = null;
      const field = (id) => document.getElementById(id);
      function showMessage(text, kind = '') {
        if (!msg) return;
        msg.textContent = text;
        msg.className = kind;
      }
      function encodeRows(values, first, second) {
        return (values || []).map((item) => item[first] + ' | ' + item[second]).join('\n');
      }
      function decodeRows(id, first, second, max) {
        const lines = field(id).value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        if (lines.length > max) throw new Error('Admite máximo ' + max + ' filas en ' + (id === 'plBenefits' ? 'beneficios.' : 'preguntas frecuentes.'));
        return lines.map((line, index) => {
          const separator = line.indexOf('|');
          if (separator < 1 || !line.slice(separator + 1).trim()) {
            throw new Error('Revisa la línea ' + (index + 1) + ': usa Título | Descripción.');
          }
          const firstValue = line.slice(0, separator).trim(), secondValue = line.slice(separator + 1).trim();
          if (id === 'plFaqs' && (!firstValue || !secondValue)) throw new Error('Cada pregunta debe tener pregunta y respuesta.');
          return { [first]: firstValue, [second]: secondValue };
        });
      }
      function fillConfig(config) {
        field('plEnabled').checked = config.enabled === true;
        field('plTemplateKey').value = config.templateKey || 'standard';
        field('plEyebrow').value = config.eyebrow || '';
        field('plHeadline').value = config.headline || '';
        field('plSubtitle').value = config.subtitle || '';
        field('plCtaLabel').value = config.ctaLabel || 'Comprar ahora';
        field('plBenefits').value = encodeRows(config.benefits, 'title', 'description');
        field('plFaqs').value = encodeRows(config.faqs, 'question', 'answer');
        const selected = new Set(config.sections || []);
        document.querySelectorAll('[name="plSection"]').forEach((checkbox) => { checkbox.checked = selected.has(checkbox.value); });
      }
      async function openEditor(productId) {
        const product = window.__catalogProducts?.[productId];
        if (!modal || !form || !product) {
          alert('No se encontró el producto. Actualiza el listado y vuelve a intentarlo.');
          return;
        }
        activeProductId = productId;
        previousFocus = document.activeElement;
        field('plProductId').value = productId;
        field('plProductName').textContent = product.name;
        field('plPreview').href = '/productos/' + encodeURIComponent(product.slug);
        fillConfig({ enabled: false, templateKey: 'standard', eyebrow: '', headline: '', subtitle: '',
          ctaLabel: 'Comprar ahora', benefits: [], faqs: [],
          sections: ['benefits', 'specifications', 'guides', 'reviews', 'faq', 'related'] });
        showMessage('Cargando configuración…');
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        modal.querySelector('.landing-modal-dialog')?.focus();
        try {
          const response = await fetch('/api/v1/admin/products/' + encodeURIComponent(productId) + '/landing', {
            headers: window.adminHeaders(), cache: 'no-store',
          });
          const result = await response.json();
          if (!response.ok || !result.data) throw new Error(result.error || 'No se pudo cargar la configuración.');
          if (activeProductId !== productId) return;
          fillConfig(result.data);
          showMessage(result.data.enabled ? 'Landing personalizada activa.' : 'Este producto usa su ficha estándar.');
        } catch (error) {
          showMessage(error.message || 'No se pudo cargar la configuración.', 'is-error');
        }
      }
      function closeEditor() {
        if (!modal) return;
        modal.hidden = true;
        document.body.style.overflow = '';
        activeProductId = '';
        previousFocus?.focus?.();
      }
      window.openProductLandingEditor = openEditor;
      closeButtons.forEach((button) => button.addEventListener('click', closeEditor));
      document.addEventListener('click', (event) => {
        const button = event.target.closest?.('[data-open-product-landing]');
        if (button) openEditor(button.dataset.openProductLanding);
      });
      document.addEventListener('keydown', (event) => {
        if (!modal || modal.hidden) return;
        if (event.key === 'Escape') closeEditor();
      });
      form?.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!activeProductId) return;
        let benefits, faqs;
        try {
          benefits = decodeRows('plBenefits', 'title', 'description', 6);
          faqs = decodeRows('plFaqs', 'question', 'answer', 10);
        } catch (error) {
          showMessage(error.message, 'is-error');
          return;
        }
        const sections = Array.from(document.querySelectorAll('[name="plSection"]:checked')).map((checkbox) => checkbox.value);
        const payload = {
          enabled: field('plEnabled').checked, templateKey: field('plTemplateKey').value,
          eyebrow: field('plEyebrow').value.trim(), headline: field('plHeadline').value.trim(),
          subtitle: field('plSubtitle').value.trim(), ctaLabel: field('plCtaLabel').value.trim(),
          benefits, faqs, sections,
        };
        const save = field('plSave');
        save.disabled = true; save.textContent = 'Guardando…';
        showMessage('Guardando cambios…');
        try {
          const response = await fetch('/api/v1/admin/products/' + encodeURIComponent(activeProductId) + '/landing', {
            method: 'PUT', headers: window.adminHeaders(true), body: JSON.stringify(payload),
          });
          const result = await response.json();
          if (!response.ok || !result.data) throw new Error(result.error || 'No se pudo guardar la landing.');
          fillConfig(result.data);
          showMessage('Landing guardada correctamente.', 'is-success');
        } catch (error) {
          showMessage(error.message || 'Error al guardar la landing.', 'is-error');
        } finally {
          save.disabled = false; save.textContent = 'Guardar landing';
        }
      });
    })();
  `;
}

export function renderProductLandingEditorCard(): string {
  return `
    <div id="product-landing-modal" class="landing-modal" hidden>
      <button class="landing-modal-backdrop" type="button" data-close-product-landing aria-label="Cerrar editor"></button>
      <section class="landing-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="pl-title" tabindex="-1">
        <header class="landing-modal-heading">
          <div><span class="landing-eyebrow">EDITOR COMERCIAL</span><h2 id="pl-title">Landing page del producto</h2><p id="pl-product-name">Configura la presentación de venta.</p></div>
          <button type="button" class="landing-close" data-close-product-landing aria-label="Cerrar editor">×</button>
        </header>
        <form id="productLandingForm" class="landing-form">
          <input type="hidden" id="plProductId" />
          <div class="landing-form-grid">
            <label class="landing-switch"><input id="plEnabled" type="checkbox" /><span><strong>Activar landing personalizada</strong><small>Si está desactivada, el producto conserva su ficha habitual.</small></span></label>
            <label>Plantilla visual
              <select id="plTemplateKey"><option value="standard">Estándar</option><option value="conversion">Conversión</option><option value="launch">Lanzamiento</option></select>
            </label>
            <label>Etiqueta superior <input id="plEyebrow" maxlength="80" placeholder="Ej. NUEVO · SERIE GAMER" /></label>
            <label class="landing-wide">Título principal <input id="plHeadline" maxlength="160" placeholder="El mensaje más importante del producto" /></label>
            <label class="landing-wide">Subtítulo <textarea id="plSubtitle" maxlength="400" rows="2" placeholder="Resume la propuesta de valor del producto."></textarea></label>
            <label>Texto del botón principal <input id="plCtaLabel" maxlength="40" value="Comprar ahora" required /></label>
          </div>
          <div class="landing-editor-help"><strong>SEO de esta landing</strong><p>Si los dejas vacíos, se usan los metadatos SEO del producto.</p></div>
          <div class="landing-form-grid"><label>Título SEO <input id="plSeoTitle" maxlength="100" placeholder="Título para buscadores" /></label><label>Descripción SEO <textarea id="plSeoDescription" maxlength="300" rows="2" placeholder="Descripción para buscadores"></textarea></label></div>
          <div class="landing-editor-help"><strong>Beneficios destacados</strong><p>Una línea por beneficio, con el formato <code>Título | Descripción</code>. Máximo 6 beneficios.</p></div>
          <textarea id="plBenefits" rows="5" placeholder="Rendimiento | Potencia para tus tareas&#10;Diseño cómodo | Ideal para usar a diario"></textarea>
          <div class="landing-editor-help"><strong>Preguntas frecuentes</strong><p>Una línea por pregunta, con el formato <code>Pregunta | Respuesta</code>. Máximo 10 preguntas.</p></div>
          <textarea id="plFaqs" rows="5" placeholder="¿Tiene garantía? | Sí, consulta las condiciones de garantía."></textarea>
          <fieldset class="landing-section-picker"><legend>Secciones que se muestran en la landing</legend>
            ${renderSectionOption('benefits', 'Beneficios')}
            ${renderSectionOption('specifications', 'Especificaciones técnicas')}
            ${renderSectionOption('guides', 'Guías y contenido editorial')}
            ${renderSectionOption('reviews', 'Reseñas y valoraciones')}
            ${renderSectionOption('faq', 'Preguntas frecuentes')}
            ${renderSectionOption('related', 'Productos relacionados')}
          </fieldset>
          <div class="landing-form-footer"><span id="plMsg" role="status" aria-live="polite"></span><a id="plPreview" href="/productos" target="_blank" rel="noopener noreferrer">Ver producto ↗</a><button type="button" class="landing-secondary" data-close-product-landing>Cancelar</button><button type="submit" class="landing-primary" id="plSave">Guardar landing</button></div>
        </form>
      </section>
    </div>`;
}

function renderSectionOption(value: string, label: string): string {
  return `<label><input type="checkbox" name="plSection" value="${value}" checked />${label}</label>`;
}

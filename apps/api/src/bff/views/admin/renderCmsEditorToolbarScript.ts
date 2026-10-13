export function renderCmsEditorToolbarScript(): string {
  return `
    function cmsFormat(command, value = null) {
      document.getElementById('cmsEditor').focus();
      document.execCommand(command, false, value);
    }
    function cmsFormatBlock(tag) {
      document.getElementById('cmsEditor').focus();
      document.execCommand('formatBlock', false, '<' + tag + '>');
    }
    function cmsFontSize(size) {
      if (!size) return;
      document.getElementById('cmsEditor').focus();
      document.execCommand('fontSize', false, size);
    }
    function cmsFontColor(color) {
      document.getElementById('cmsEditor').focus();
      document.execCommand('foreColor', false, color);
    }
    function cmsHighlightColor(color) {
      document.getElementById('cmsEditor').focus();
      document.execCommand('hiliteColor', false, color);
    }
    function cmsCreateLink() {
      const url = prompt('Ingresa la URL del enlace (ej: /productos o https://...):');
      if (url) {
        document.getElementById('cmsEditor').focus();
        document.execCommand('createLink', false, url);
      }
    }
    function loadCmsTemplate(key) {
      const t = window.__CMS_TEMPLATES ? window.__CMS_TEMPLATES[key] : null;
      if (!t) return;
      if (document.getElementById('cmsTitle').value && !confirm('¿Deseas cargar la plantilla ' + t.name + '?')) return;
      document.getElementById('cmsTitle').value = t.title;
      const slugInput = document.getElementById('cmsSlug');
      slugInput.value = t.slug;
      slugInput.dataset.manual = 'true';
      document.getElementById('cmsSeoTitle').value = t.seoTitle;
      document.getElementById('cmsSeoDesc').value = t.seoDescription;
      document.getElementById('cmsEditor').innerHTML = t.html;
      if (typeof updateCmsSeoCounters === 'function') updateCmsSeoCounters();
    }
    window.cmsFormat = cmsFormat;
    window.cmsFormatBlock = cmsFormatBlock;
    window.cmsFontSize = cmsFontSize;
    window.cmsFontColor = cmsFontColor;
    window.cmsHighlightColor = cmsHighlightColor;
    window.cmsCreateLink = cmsCreateLink;
    window.loadCmsTemplate = loadCmsTemplate;
  `;
}

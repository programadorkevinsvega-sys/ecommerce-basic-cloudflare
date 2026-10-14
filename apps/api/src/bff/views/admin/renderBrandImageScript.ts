export function renderBrandImageScript(): string {
  return `
    window.setBrandImage = (id) => {
      const input = document.getElementById('brandImageId'), image = document.getElementById('brandImagePreview');
      if (!input || !image) return;
      input.value = id || '';
      image.hidden = !id; image.src = id ? '/media/' + encodeURIComponent(id) : '';
      document.getElementById('brandImagePlaceholder').hidden = Boolean(id);
      document.getElementById('brandImageRemove').hidden = !id;
    };
    document.getElementById('brandImageFile')?.addEventListener('change', async (event) => {
      const input = event.currentTarget, file = input.files?.[0]; if (!file) return;
      const status = document.getElementById('brandImageStatus'); status.textContent = 'Subiendo imagen…';
      const button = document.querySelector('#newBrandForm button[type="submit"]'); if (button) button.disabled = true;
      const form = new FormData(); form.append('file', file); form.append('altText', 'Marca ' + (document.getElementById('brandName').value.trim() || file.name)); form.append('isPrivate', 'false');
      try {
        const response = await fetch('/media/upload', { method:'POST', headers:window.adminHeaders(false), body:form });
        const body = await response.json(); if (!response.ok || typeof body.data?.id !== 'string') throw new Error(body.error || 'No se pudo subir la imagen.');
        window.setBrandImage(body.data.id); status.textContent = 'Imagen lista para guardar.';
      } catch (error) { status.textContent = error instanceof Error ? error.message : 'No se pudo subir la imagen.'; input.value = ''; }
      finally { if (button) button.disabled = false; }
    });
    document.getElementById('brandImageRemove')?.addEventListener('click', () => {
      window.setBrandImage(''); document.getElementById('brandImageFile').value = '';
      document.getElementById('brandImageStatus').textContent = 'Imagen quitada. Guarda la marca para aplicar el cambio.';
    });
  `;
}

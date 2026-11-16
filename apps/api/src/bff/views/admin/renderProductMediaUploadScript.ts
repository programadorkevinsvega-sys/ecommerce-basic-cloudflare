export function renderProductMediaUploadScript(): string {
  return `
    async function handleProductImageSelected(input) {
      if (!input.files || input.files.length === 0) return;
      if (!window.currentProductMediaIds) window.currentProductMediaIds = [];
      const files = Array.from(input.files);
      const remainingSlots = 5 - window.currentProductMediaIds.length;
      if (remainingSlots <= 0) {
        alert('Ya has alcanzado el máximo de 5 imágenes permitidas para este producto.');
        input.value = '';
        return;
      }
      const filesToUpload = files.slice(0, remainingSlots);
      const statusSpan = document.getElementById('pImageUploadStatus');
      const failures = [];
      let uploadedCount = 0;
      if (statusSpan) {
        statusSpan.textContent = '⏳ Subiendo ' + filesToUpload.length + ' imagen(es) a R2...';
        statusSpan.style.color = '#56675b';
      }
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('altText', document.getElementById('pName')?.value || file.name.replace(/\\.[^/.]+$/, ''));
        formData.append('isPrivate', 'false');
        try {
          const headers = window.adminHeaders ? window.adminHeaders(false) : {};
          const response = await fetch('/media/upload', { method: 'POST', headers, body: formData });
          const result = await response.json().catch(() => ({}));
          if (response.ok && result.data?.id) {
            window.currentProductMediaIds.push(result.data.id);
            uploadedCount += 1;
            updateProductMediaGrid();
          } else {
            failures.push(productRequestError(response, result, 'El servidor no devolvió el identificador de la imagen.'));
          }
        } catch {
          failures.push('No se pudo conectar para subir la imagen. Revisa tu conexión e inténtalo de nuevo.');
        }
      }
      input.value = '';
      if (!statusSpan) return;
      statusSpan.textContent = failures.length
        ? (uploadedCount
          ? '⚠️ Se cargaron ' + uploadedCount + ' imagen(es), pero falló otra carga: ' + failures[0]
          : '❌ No se pudo cargar la imagen: ' + failures[0])
        : '✅ Imágenes listas (' + window.currentProductMediaIds.length + '/5)';
      statusSpan.style.color = failures.length ? '#b42318' : '#18764b';
    }
    document.getElementById('pMediaFileInput')?.addEventListener('change', (event) => handleProductImageSelected(event.currentTarget));
  `;
}

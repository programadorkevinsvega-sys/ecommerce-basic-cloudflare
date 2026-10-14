export function renderTaxonomyFormsScript(): string {
  return `
    const brandNameInput = document.getElementById('brandName');
    const brandSlugInput = document.getElementById('brandSlug');
    const createBrandSlug = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    brandNameInput?.addEventListener('input', () => {
      if (brandSlugInput && !brandSlugInput.dataset.manuallyEdited) brandSlugInput.value = createBrandSlug(brandNameInput.value);
    });
    brandSlugInput?.addEventListener('input', () => {
      if (!brandSlugInput.value) delete brandSlugInput.dataset.manuallyEdited;
      else brandSlugInput.dataset.manuallyEdited = 'true';
    });

    document.getElementById('newCategoryForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('catMsg');
      const payload = {
        name: document.getElementById('catName').value,
        slug: document.getElementById('catSlug').value || undefined,
        description: document.getElementById('catDesc').value || undefined
      };
      const res = await fetch('/api/v1/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        msg.textContent = '✅ Categoría creada';
        msg.style.background = '#065f46';
        msg.style.display = 'block';
        setTimeout(() => window.location.reload(), 800);
      }
    });

    document.getElementById('newBrandForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('brandMsg');
      const payload = {
        name: document.getElementById('brandName').value,
        slug: document.getElementById('brandSlug').value || undefined,
        websiteUrl: document.getElementById('brandWeb').value || undefined
      };
      const res = await fetch('/api/v1/admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        msg.textContent = '✅ Marca / Proveedor guardado';
        msg.style.background = '#065f46';
        msg.style.display = 'block';
        setTimeout(() => window.location.reload(), 800);
      }
    });

    document.getElementById('newAttributeForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('attrMsg');
      const options = document.getElementById('attrOptions').value
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);
      const payload = {
        name: document.getElementById('attrName').value,
        code: document.getElementById('attrCode').value,
        type: document.getElementById('attrType').value,
        options
      };
      const res = await fetch('/api/v1/admin/attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        msg.textContent = '✅ Atributo configurado';
        msg.style.background = '#065f46';
        msg.style.display = 'block';
        setTimeout(() => window.location.reload(), 800);
      }
    });
  `;
}

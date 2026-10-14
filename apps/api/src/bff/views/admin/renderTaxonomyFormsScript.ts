export function renderTaxonomyFormsScript(): string {
  return `
    const catalogPageCopy = {
      categories: ['Categorías', 'Organiza los productos en categorías independientes.'],
      brands: ['Marcas', 'Administra marcas y su información pública.'],
      providers: ['Proveedores', 'Consulta proveedores registrados.'],
      attributes: ['Atributos', 'Define características disponibles para asignar a productos.'],
      variants: ['Variantes', 'Consulta variantes registradas en el catálogo.']
    };
    window.showCatalogPage = (key, navButton) => {
      document.querySelectorAll('[data-taxonomy-page]').forEach((page) => { page.hidden = page.dataset.taxonomyPage !== key; });
      document.querySelectorAll('.admin-nav-link[data-tab="taxonomies"]').forEach((button) => {
        const selected = button === navButton;
        button.classList.toggle('active', selected);
        if (selected) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
      });
      const copy = catalogPageCopy[key] || catalogPageCopy.categories;
      document.getElementById('taxonomy-page-title').textContent = copy[0];
      document.getElementById('taxonomy-page-description').textContent = document.querySelector('[data-taxonomy-page="' + key + '"]')?.dataset.taxonomyDescription || copy[1];
    };
    window.showCatalogPage('categories', document.querySelector('.admin-nav-link[data-tab="taxonomies"]'));

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
        description: document.getElementById('brandDescription').value || undefined,
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

    window.saveBrandDescription = async (id) => {
      const description = document.getElementById('brand-description-' + id)?.value || '';
      const res = await fetch('/api/v1/admin/brands/' + encodeURIComponent(id) + '/description', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description })
      });
      if (res.ok) window.location.reload();
      else window.alert('No se pudo guardar la descripción de la marca.');
    };

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

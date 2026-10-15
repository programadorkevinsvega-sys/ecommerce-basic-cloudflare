export function renderMarketingNavigationScript(): string {
  return `
    const marketingPages = {
      'promo-banners': ['Banners Hero Promocionales', 'Campañas visuales con CTA para la tienda.'],
      'info-banners': ['Banners Hero Informativos', 'Comunicados visuales sin botón promocional.'],
      announcements: ['Anuncios & Barra Superior', 'Mensajes breves para la barra superior y otras ubicaciones.'],
      'promotion-rule': ['Regla de Promoción', 'Descuentos automáticos aplicados según las reglas configuradas.'],
      'discount-coupon': ['Cupón de Descuento', 'Códigos de descuento que los clientes pueden canjear.'],
      'free-shipping': ['Envío gratis', 'Reglas de envío gratis para productos, categorías, colecciones o todo el catálogo.'],
    };

    window.showMarketingPage = (key) => {
      document.querySelectorAll('[data-marketing-page]').forEach((page) => {
        page.hidden = page.dataset.marketingPage !== key;
      });
      const page = marketingPages[key];
      const tab = key === 'promo-banners' || key === 'info-banners' || key === 'announcements' ? 'storefront' : 'promotions';
      const title = document.querySelector('#tab-' + tab + ' .marketing-page-title');
      const description = document.querySelector('#tab-' + tab + ' .marketing-page-description');
      if (page && title && description) {
        title.textContent = page[0];
        description.textContent = page[1];
      }
    };

    const marketingFormPages = {
      'promo-banners': ['newPromoBannerForm', 'Crear banner promocional', 'resetPromoBannerForm'],
      'info-banners': ['newInfoBannerForm', 'Crear banner informativo', 'resetInfoBannerForm'],
      announcements: ['newAnnouncementForm', 'Crear anuncio', 'resetAnnouncementForm'],
      'promotion-rule': ['newPromoRuleForm', 'Crear regla de promoción', 'resetPromoRuleForm'],
      'discount-coupon': ['newCouponForm', 'Crear cupón de descuento', 'resetCouponForm'],
    };

    function buildMarketingDialogs() {
      Object.entries(marketingFormPages).forEach(([key, [formId, action, resetName]]) => {
        const form = document.getElementById(formId);
        const page = document.querySelector('[data-marketing-page="' + key + '"]');
        if (!form || !page || page.querySelector('dialog.marketing-modal')) return;
        const create = document.createElement('button');
        create.type = 'button';
        create.className = 'marketing-create-button btn-primary';
        create.textContent = '+ ' + action;
        create.addEventListener('click', () => window.openMarketingModal(key));
        const toolbar = document.createElement('div');
        toolbar.className = 'marketing-page-toolbar';
        toolbar.append(create);
        page.insertBefore(toolbar, page.firstChild);

        const dialog = document.createElement('dialog');
        dialog.className = 'marketing-modal';
        dialog.setAttribute('aria-label', action);
        const heading = document.createElement('header');
        heading.className = 'marketing-modal-heading';
        const title = document.createElement('h2');
        title.textContent = action;
        const close = document.createElement('button');
        close.type = 'button'; close.className = 'marketing-modal-close'; close.textContent = '×';
        close.setAttribute('aria-label', 'Cerrar formulario');
        close.addEventListener('click', () => dialog.close());
        heading.append(title, close);
        const cancel = document.createElement('button');
        cancel.type = 'button'; cancel.className = 'marketing-modal-cancel'; cancel.textContent = 'Cancelar';
        cancel.addEventListener('click', () => dialog.close());
        form.append(cancel);
        dialog.append(heading, form);
        page.append(dialog);
        dialog.addEventListener('close', () => {
          const reset = window[resetName];
          if (typeof reset === 'function') reset();
        });
      });
    }

    window.openMarketingModal = (key) => {
      const dialog = document.querySelector('[data-marketing-page="' + key + '"] dialog.marketing-modal');
      if (dialog && !dialog.open) dialog.showModal();
      dialog?.querySelector('input:not([type="hidden"]),select,textarea')?.focus();
    };
    buildMarketingDialogs();
  `;
}

export function renderMarketingNavigationScript(): string {
  return `
    const marketingPages = {
      'promo-banners': ['Banners Hero Promocionales', 'Campañas visuales con CTA para la tienda.'],
      'info-banners': ['Banners Hero Informativos', 'Comunicados visuales sin botón promocional.'],
      announcements: ['Anuncios & Barra Superior', 'Mensajes breves para la barra superior y otras ubicaciones.'],
      'promotion-rule': ['Regla de Promoción', 'Descuentos automáticos aplicados según las reglas configuradas.'],
      'discount-coupon': ['Cupón de Descuento', 'Códigos de descuento que los clientes pueden canjear.'],
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
  `;
}

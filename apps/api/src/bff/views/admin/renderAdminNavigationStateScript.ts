export function renderAdminNavigationStateScript(): string {
  return `
    window.saveAdminNavigationState = (button) => {
      if (!button?.dataset.adminNav) return;
      try {
        sessionStorage.setItem('adminNavigationState', JSON.stringify({
          nav: button.dataset.adminNav,
          sidebarScroll: document.querySelector('.admin-nav')?.scrollTop || 0,
        }));
      } catch { /* La navegación sigue funcionando si el almacenamiento no está disponible. */ }
    };

    window.addEventListener('DOMContentLoaded', () => {
      try {
        const saved = JSON.parse(sessionStorage.getItem('adminNavigationState') || 'null');
        if (!saved?.nav) return;
        const button = Array.from(document.querySelectorAll('[data-admin-nav]'))
          .find((item) => item.dataset.adminNav === saved.nav);
        if (!button) return;
        button.click();
        const sidebar = document.querySelector('.admin-nav');
        if (sidebar) sidebar.scrollTop = Number(saved.sidebarScroll) || 0;
      } catch { /* Una sesión sin estado guardado abre el resumen normalmente. */ }
    });
  `;
}

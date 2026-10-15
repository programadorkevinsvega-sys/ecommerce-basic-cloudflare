export function renderMenuManagementSection(): string {
  return `<section class="menu-admin-screen">
    <header class="menu-admin-heading"><div><span>MARKETING · CMS</span><h1>Menús</h1><p>Organiza enlaces y páginas en grupos para la navegación de la tienda.</p></div><button id="menu-save" class="menu-primary" type="button" onclick="saveAdminMenu()">Guardar menú</button></header>
    <nav class="menu-tabs" aria-label="Menús de la tienda"><button class="active" type="button" data-menu-code="header" onclick="selectAdminMenu('header',this)">Menú principal</button><button type="button" data-menu-code="footer" onclick="selectAdminMenu('footer',this)">Pie de página</button></nav>
    <section class="menu-card"><div class="menu-card-heading"><div><h2 id="menu-heading">Menú principal</h2><p id="menu-description">Enlaces visibles en el encabezado de la tienda.</p></div><button class="menu-secondary" type="button" onclick="addAdminMenuItem('link')">+ Añadir enlace</button><button class="menu-secondary" type="button" onclick="addAdminMenuItem('group')">+ Añadir grupo</button></div>
      <label class="menu-title-field">Nombre del menú<input id="menu-title" maxlength="100" value="Navegación principal"></label>
      <div id="menu-items" class="menu-items" aria-live="polite"><p class="menu-loading">Cargando menús…</p></div>
      <p id="menu-message" role="status" class="menu-message"></p>
      <footer class="menu-footer-actions"><span>Los grupos admiten hasta dos niveles de elementos anidados.</span><button class="menu-primary" type="button" onclick="saveAdminMenu()">Guardar menú</button></footer>
    </section>
  </section>`;
}

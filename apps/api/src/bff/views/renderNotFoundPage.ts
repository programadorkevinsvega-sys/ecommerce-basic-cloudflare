export function renderNotFoundPage(path: string): string {
  const isCollection = path.startsWith('/colecciones/');
  return `<section class="storefront-not-found" aria-labelledby="not-found-title">
    <span class="not-found-code">ERROR 404</span>
    <h1 id="not-found-title">${isCollection ? 'No encontramos esta colección' : 'No encontramos esta página'}</h1>
    <p>Puede que la dirección haya cambiado o que el contenido ya no esté disponible. Puedes continuar explorando la tienda.</p>
    <nav class="not-found-links" aria-label="Opciones para continuar">
      <a href="/productos">Explorar catálogo</a>
      <a href="/colecciones">${isCollection ? 'Ver todas las colecciones' : 'Ver colecciones'}</a>
      <a href="/">Ir al inicio</a>
    </nav>
    <span class="sr-only">Dirección solicitada: ${escapeHtml(path)}</span>
  </section>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

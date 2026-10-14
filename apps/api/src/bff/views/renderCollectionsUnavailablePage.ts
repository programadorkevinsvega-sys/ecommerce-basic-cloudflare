export function renderCollectionsUnavailablePage(): string {
  return `<nav class="catalog-breadcrumb" aria-label="Ruta de navegación"><a href="/">Inicio</a><span aria-hidden="true">/</span><span aria-current="page">Colecciones</span></nav>
    <section class="collections-unavailable" aria-labelledby="collections-title">
      <span class="eyebrow">Explora Vega Store</span>
      <h1 id="collections-title">Colecciones</h1>
      <p>Estamos preparando este espacio. Las colecciones aparecerán aquí cuando estén configuradas y publicadas.</p>
      <nav class="not-found-links" aria-label="Continuar explorando"><a href="/productos">Explorar catálogo</a><a href="/">Volver al inicio</a></nav>
    </section>`;
}

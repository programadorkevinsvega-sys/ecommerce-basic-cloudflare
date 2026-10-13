export const storefrontCatalogStyles = String.raw`
    .catalog-breadcrumb { display: flex; align-items: center; gap: .6rem; padding: .8rem 0 1rem; color: #65716a; font-size: .82rem; }
    .catalog-breadcrumb a { color: #424e47; text-decoration: none; }
    .catalog-breadcrumb a:hover { color: #16201b; text-decoration: underline; }
    .catalog-breadcrumb [aria-current="page"] { color: #16201b; font-weight: 650; }
    .catalog-layout { display: grid; grid-template-columns: minmax(200px, 230px) minmax(0, 1fr); align-items: start; gap: 1.5rem; }
    .catalog-sidebar { min-width: 0; }
    .catalog-filters { padding: 1.1rem; border: 1px solid #e1e4da; border-radius: 16px; background: #fff; }
    .catalog-filters > summary { display: flex; min-height: 32px; align-items: center; justify-content: space-between; gap: .75rem; cursor: pointer; font-size: 1rem; font-weight: 650; list-style: none; }
    .catalog-filters > summary::-webkit-details-marker { display: none; }
    .catalog-chevron { color: #65716a; transition: transform .18s ease; }
    .catalog-filters[open] .catalog-chevron { transform: rotate(180deg); }
    .catalog-filter-group { display: flex; flex-direction: column; gap: .35rem; padding: 1rem 0 .8rem; border-top: 1px solid #e1e4da; }
    .catalog-filter-group h2 { margin: 0 0 .25rem; font-size: .9rem; font-weight: 650; letter-spacing: 0; }
    .catalog-filter-option { display: flex; min-height: 40px; align-items: center; gap: .65rem; padding: 0 .4rem; border-radius: 8px; color: #424e47; font-size: .82rem; cursor: pointer; }
    .catalog-filter-option:hover { background: #f3f4ef; }
    .catalog-filter-option input { width: 17px; height: 17px; flex: 0 0 17px; margin: 0; accent-color: #1f4d3a; }
    .catalog-filter-option span:nth-of-type(1) { min-width: 0; flex: 1; overflow-wrap: anywhere; }
    .catalog-filter-option span:nth-of-type(2) { color: #65716a; font-variant-numeric: tabular-nums; }
    .catalog-price-input { display: flex; align-items: center; justify-content: space-between; gap: .5rem; color: #424e47; font-size: .78rem; }
    .catalog-price-input input { width: 115px; min-height: 40px !important; padding: .4rem .55rem !important; border: 1px solid #c7ccbe !important; border-radius: 9px !important; background: #fff !important; color: #16201b !important; font-size: .8rem; }
    .catalog-filter-group > p { margin: .3rem 0 0; color: #65716a; font-size: .75rem; }
    .catalog-toolbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
    .catalog-toolbar h1 { margin: 0; font-size: clamp(2rem, 3.2vw, 2.55rem); letter-spacing: -.045em; }
    .catalog-toolbar p { margin: .35rem 0 0; color: #424e47; font-size: .85rem; }
    .catalog-sort { display: flex; flex: 0 0 auto; flex-direction: column; gap: .35rem; color: #424e47; font-size: .78rem; font-weight: 650; }
    .catalog-sort select { min-width: 175px; min-height: 44px !important; padding: 0 .7rem !important; border: 1px solid #c7ccbe !important; border-radius: 10px !important; background: #fff !important; color: #16201b !important; }
    .catalog-active-filters { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; margin: .75rem 0; color: #424e47; font-size: .8rem; }
    .catalog-active-filters > div { display: flex; flex-wrap: wrap; gap: .4rem; }
    .catalog-filter-chip { min-height: 34px; padding: 0 .7rem; border: 1px solid #c7ccbe; border-radius: 999px; background: #fff; color: #16201b; font: inherit; font-size: .76rem; cursor: pointer; }
    .catalog-filter-chip:hover { border-color: #1f4d3a; background: #e8ebe2; }
    .catalog-results-count { margin: 0 0 .55rem; color: #65716a; font-size: .78rem; }
    .catalog-cart-feedback { margin: 0 0 .8rem; padding: .7rem .9rem; border: 1px solid #cfe0d5; border-radius: 10px; background: #e4eee8; color: #1f4d3a; font-size: .85rem; }
    .catalog-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
    .catalog-grid[hidden], .catalog-grid [hidden], .catalog-filter-empty[hidden] { display: none !important; }
    .catalog-filter-empty, .catalog-empty { display: flex; min-height: 280px; flex-direction: column; align-items: center; justify-content: center; gap: .7rem; padding: 2rem; border: 1px solid #e1e4da; border-radius: 16px; background: #fff; text-align: center; }
    .catalog-filter-empty > span, .catalog-empty > span { color: #1f4d3a; font-size: 2rem; }
    .catalog-filter-empty h2, .catalog-empty h2 { margin: 0; font-size: 1.25rem; }
    .catalog-filter-empty p, .catalog-empty p { max-width: 48ch; margin: 0; color: #424e47; }
    .catalog-filter-empty button, .catalog-empty a { display: inline-flex; min-height: 44px; align-items: center; justify-content: center; margin-top: .4rem; padding: 0 1rem; border: 0; border-radius: 10px; background: #16201b; color: #fff; font: inherit; font-weight: 650; text-decoration: none; cursor: pointer; }
    .catalog-filter-empty button:hover, .catalog-empty a:hover { background: #2a372f; color: #fff; }
    @media (max-width: 1050px) { .catalog-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 760px) { .catalog-layout { grid-template-columns: minmax(0, 1fr); gap: 1rem; } .catalog-sidebar { order: 0; } .catalog-filters { padding: .8rem 1rem; } .catalog-toolbar { align-items: flex-start; } .catalog-grid { gap: .75rem; } }
    @media (max-width: 520px) { .catalog-toolbar { flex-direction: column; } .catalog-sort { width: 100%; } .catalog-sort select { width: 100%; } .catalog-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .55rem; } }
`;

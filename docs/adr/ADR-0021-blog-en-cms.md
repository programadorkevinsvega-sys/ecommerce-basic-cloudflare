# ADR-0021: Blog administrado dentro del módulo CMS

## Estado
Aceptado (2026-10-14)

## Contexto
La tienda necesita contenido editorial con publicaciones, autores, categorías, imágenes, programación, SEO y páginas públicas indexables. Las páginas institucionales CMS ya existen y deben conservar su interfaz y su modelo.

## Decisión
- El blog es una capacidad propia dentro del bounded context `cms`, con tablas `cms_blog_*`; no se añade otro módulo ni una segunda aplicación.
- En el panel, “Páginas CMS” y “Blog” son pantallas independientes dentro del grupo de navegación CMS. La nueva pantalla no sustituye ni modifica la gestión de páginas institucionales.
- Los autores son perfiles editoriales del CMS y no usuarios de `identity`. Las imágenes guardan IDs del módulo `media`, sin FK entre módulos; la API administrativa verifica que cada referencia apunte a un medio público de tipo imagen.
- Las publicaciones programadas se publican en el Cron existente cada cinco minutos; cada publicación automática se registra en auditoría.
- El listado público solo incluye publicaciones `published` e indexables. El detalle soporta `noindex` y canonical manual, datos Open Graph y JSON-LD `BlogPosting`. El sitemap del blog se genera desde el CMS.

## Consecuencias y recuperación
La migración `cms__0003_blog.sql` solo agrega tablas e índices. No modifica páginas, contenido ni archivos R2. No se define down migration: en rollback se conserva el esquema y se revierte el Worker a una versión anterior, que ignora las tablas nuevas. Una corrección futura de datos deberá ser aditiva y auditada.

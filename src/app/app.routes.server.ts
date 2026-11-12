import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Renderização híbrida: páginas estáticas são pré-renderizadas no build,
 * páginas com dados são renderizadas no servidor a cada requisição.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'metrics', renderMode: RenderMode.Prerender },
  { path: 'articles', renderMode: RenderMode.Server },
  { path: 'articles/:slug', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Server },
];

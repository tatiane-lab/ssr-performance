import { RenderMode, ServerRoute } from '@angular/ssr';
import { ARTICLE_SUMMARIES } from './data/articles.meta';

/** GitHub Pages: tudo é pré-renderizado no build (não existe servidor em produção). */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'metrics', renderMode: RenderMode.Prerender },
  { path: 'articles', renderMode: RenderMode.Prerender },
  {
    path: 'articles/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => ARTICLE_SUMMARIES.map((a) => ({ slug: a.slug })),
  },
  { path: '**', renderMode: RenderMode.Prerender },
];

import { Routes } from '@angular/router';
import { articleResolver } from './core/article.resolver';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'articles',
    loadComponent: () => import('./pages/articles/articles').then((m) => m.Articles),
  },
  {
    path: 'articles/:slug',
    resolve: { article: articleResolver },
    loadComponent: () => import('./pages/article/article').then((m) => m.ArticlePage),
  },
  {
    path: 'metrics',
    loadComponent: () => import('./pages/metrics/metrics').then((m) => m.Metrics),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
  },
];

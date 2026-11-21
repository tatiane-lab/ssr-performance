import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { Article, ArticleSummary } from '../data/article.models';
import { ARTICLE_SUMMARIES } from '../data/articles.meta';

/**
 * Versão estática (GitHub Pages): não há servidor, então os dados vêm dos módulos locais.
 * Os corpos dos artigos ficam em um chunk lazy, carregado só ao abrir um artigo.
 */
@Injectable({ providedIn: 'root' })
export class ArticlesService {
  getAll(): Observable<ArticleSummary[]> {
    return from(Promise.resolve([...ARTICLE_SUMMARIES]));
  }

  getBySlug(slug: string): Observable<Article> {
    return from(
      import('../data/articles.content').then(({ ARTICLES }) => {
        const article = ARTICLES.find((a) => a.slug === slug);
        if (!article) throw new Error('Artigo não encontrado');
        return article;
      }),
    );
  }

  getRelated(slug: string): Observable<ArticleSummary[]> {
    const current = ARTICLE_SUMMARIES.find((a) => a.slug === slug);
    if (!current) return from(Promise.resolve([]));
    const related = ARTICLE_SUMMARIES.filter(
      (a) => a.slug !== slug && a.tags.some((t) => current.tags.includes(t)),
    );
    const fallback = ARTICLE_SUMMARIES.filter((a) => a.slug !== slug);
    return from(Promise.resolve((related.length ? related : fallback).slice(0, 3)));
  }
}

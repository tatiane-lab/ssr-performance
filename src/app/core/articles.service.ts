import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Article, ArticleSummary } from '../data/article.models';

/**
 * Consome a API Express. Requisições GET feitas durante o SSR são serializadas no
 * HTML (cache de transferência HTTP) e não se repetem no navegador.
 */
@Injectable({ providedIn: 'root' })
export class ArticlesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/articles';

  getAll(): Observable<ArticleSummary[]> {
    return this.http.get<ArticleSummary[]>(this.apiUrl);
  }

  getBySlug(slug: string): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/${encodeURIComponent(slug)}`);
  }

  getRelated(slug: string): Observable<ArticleSummary[]> {
    return this.http.get<ArticleSummary[]>(`${this.apiUrl}/${encodeURIComponent(slug)}/related`);
  }
}

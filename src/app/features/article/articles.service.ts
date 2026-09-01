import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  publishedAt: string;
  tags: string[];
}

@Injectable({ providedIn: 'root' })
export class ArticlesService {
  private http = inject(HttpClient);
  private apiUrl = '/api/articles';

  getAll(): Observable<Article[]> {
    return this.http.get<Article[]>(this.apiUrl);
  }

  getBySlug(slug: string): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/${slug}`);
  }

  getRelated(id: string): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/${id}/related`);
  }
}

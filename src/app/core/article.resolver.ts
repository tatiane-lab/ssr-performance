import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Article } from '../data/article.models';
import { ArticlesService } from './articles.service';

/** Resolve o artigo antes da ativação da rota: o SSR espera os dados e pode responder 404. */
export const articleResolver: ResolveFn<Article | null> = (route) =>
  inject(ArticlesService)
    .getBySlug(route.paramMap.get('slug') ?? '')
    .pipe(catchError(() => of(null)));

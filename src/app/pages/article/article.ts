import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  RESPONSE_INIT,
  effect,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';
import { Article } from '../../data/article.models';
import { Comments } from './comments';
import { RelatedArticles } from './related-articles';

@Component({
  selector: 'app-article-page',
  imports: [NgOptimizedImage, RouterLink, RelatedArticles, Comments],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (article(); as a) {
      <article class="article">
        <a class="back" routerLink="/articles">← Todos os artigos</a>
        <header class="article-header">
          <ul class="tags">
            @for (tag of a.tags; track tag) {
              <li>{{ tag }}</li>
            }
          </ul>
          <h1>{{ a.title }}</h1>
          <p class="meta">
            Por {{ a.author }} ·
            <time [attr.datetime]="a.publishedAt">{{ formatDate(a.publishedAt) }}</time>
            · {{ a.readingMinutes }} min de leitura
          </p>
        </header>

        <!-- Elemento do LCP: priority adiciona fetchpriority=high + preload; fill + aspect-ratio reserva o espaço (CLS 0). -->
        <div class="article-hero">
          <img
            [ngSrc]="a.coverImage"
            [alt]="'Ilustração do artigo: ' + a.title"
            priority
            fill
            sizes="(max-width: 840px) 100vw, 800px"
          />
        </div>

        <div class="article-body">
          @for (s of a.sections; track s.heading) {
            <h2>{{ s.heading }}</h2>
            @for (p of s.paragraphs; track $index) {
              <p>{{ p }}</p>
            }
            @if (s.code) {
              <pre><code>{{ s.code }}</code></pre>
            }
          }
        </div>

        <!-- Abaixo da dobra: o HTML vem do servidor e o JS só é hidratado quando necessário. -->
        <section class="related" aria-labelledby="related-title">
          <h2 id="related-title">Artigos relacionados</h2>
          @defer (on viewport; hydrate on viewport) {
            <app-related-articles [slug]="a.slug" />
          } @placeholder {
            <div class="related-placeholder"></div>
          }
        </section>

        <section class="comments" aria-labelledby="comments-title">
          <h2 id="comments-title">Comentários</h2>
          @defer (on idle; hydrate on interaction) {
            <app-comments />
          } @placeholder {
            <div class="comments-placeholder"></div>
          }
        </section>
      </article>
    } @else {
      <section class="not-found">
        <h1>Artigo não encontrado</h1>
        <p class="lead">O artigo que você procura não existe ou foi removido.</p>
        <a class="btn primary" routerLink="/articles">Ver todos os artigos</a>
      </section>
    }
  `,
})
export class ArticlePage {
  /** Vinculado ao resolver da rota via `withComponentInputBinding()`. */
  readonly article = input<Article | null>(null);

  private readonly seo = inject(SeoService);
  private readonly responseInit = inject(RESPONSE_INIT, { optional: true });

  constructor() {
    effect(() => {
      const a = this.article();
      if (!a) {
        if (this.responseInit) this.responseInit.status = 404;
        this.seo.update({ title: 'Artigo não encontrado', description: 'Artigo não encontrado.', noindex: true });
        return;
      }
      this.seo.update({
        title: a.title,
        description: a.excerpt,
        image: a.coverImage,
        type: 'article',
        publishedAt: a.publishedAt,
        author: a.author,
        keywords: a.tags,
      });
    });
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(iso));
  }
}

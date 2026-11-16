import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';
import { ARTICLE_SUMMARIES } from '../../data/articles.meta';
import { ArticleCard } from '../../shared/article-card';

interface Technique {
  readonly icon: string;
  readonly title: string;
  readonly text: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, ArticleCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero">
      <p class="eyebrow">Angular 22 · SSR · Core Web Vitals</p>
      <h1>Performance que dá para medir, na própria página</h1>
      <p class="lead">
        Uma aplicação de conteúdo com renderização híbrida (prerender + SSR), hidratação incremental,
        imagens otimizadas e um painel que mede LCP, CLS e INP no seu navegador.
      </p>
      <div class="actions">
        <a class="btn primary" routerLink="/metrics">Abrir painel de métricas</a>
        <a class="btn" routerLink="/articles">Ver artigos</a>
      </div>
    </section>

    <section aria-labelledby="tech-title">
      <h2 id="tech-title">Técnicas aplicadas</h2>
      <div class="grid techniques">
        @for (t of techniques; track t.title) {
          <article class="panel">
            <span class="icon" aria-hidden="true">{{ t.icon }}</span>
            <h3>{{ t.title }}</h3>
            <p>{{ t.text }}</p>
          </article>
        }
      </div>
    </section>

    <section aria-labelledby="latest-title">
      <h2 id="latest-title">Últimos artigos</h2>
      <!-- Renderizado no prerender; o JS só é baixado/hidratado quando entra no viewport. -->
      @defer (on viewport; hydrate on viewport) {
        <div class="grid cards">
          @for (a of latest; track a.id) {
            <app-article-card [article]="a" />
          }
        </div>
      } @placeholder {
        <div class="grid cards cards-placeholder"></div>
      }
    </section>
  `,
})
export class Home {
  protected readonly latest = ARTICLE_SUMMARIES.slice(-3).reverse();

  protected readonly techniques: readonly Technique[] = [
    { icon: '🧩', title: 'Hidratação incremental', text: 'Blocos @defer com hydrate on viewport/interaction: o HTML vem pronto, o JS só quando necessário.' },
    { icon: '🔁', title: 'Event replay', text: 'Cliques e digitação antes da hidratação são capturados e reexecutados depois.' },
    { icon: '🖼️', title: 'NgOptimizedImage', text: 'priority + fill + sizes no hero para melhorar o LCP e evitar layout shift.' },
    { icon: '📦', title: 'Cache HTTP / TransferState', text: 'O que o servidor buscou é serializado no HTML: zero requisição duplicada no cliente.' },
    { icon: '🗂️', title: 'Renderização híbrida', text: 'Prerender em páginas estáticas, SSR por requisição em páginas com dados.' },
    { icon: '🔎', title: 'SEO completo', text: 'Title, description, Open Graph, canonical e JSON-LD por rota, mesmo no HTML do servidor.' },
  ];

  constructor() {
    inject(SeoService).update({
      title: 'Início',
      description:
        'Demonstração de Angular SSR com hidratação incremental, @defer, NgOptimizedImage e painel de Web Vitals em tempo real.',
      keywords: ['Angular', 'SSR', 'Performance', 'Web Vitals'],
    });
  }
}

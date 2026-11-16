import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { ArticlesService } from '../../core/articles.service';
import { SeoService } from '../../core/seo.service';
import { ArticleSummary } from '../../data/article.models';
import { ArticleCard } from '../../shared/article-card';

@Component({
  selector: 'app-articles',
  imports: [ArticleCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <h1>Artigos</h1>
      <p class="lead">Lista renderizada no servidor a cada requisição (dados vindos de <code>/api/articles</code>).</p>
      <label class="search">
        <span class="sr-only">Filtrar artigos</span>
        <input
          type="search"
          placeholder="Filtrar por título ou tag…"
          [value]="query()"
          (input)="onQuery($event)"
        />
      </label>
    </header>

    @if (failed()) {
      <p class="notice error" role="alert">Não foi possível carregar os artigos.</p>
    } @else {
      <div class="grid cards" aria-live="polite">
        @for (a of filtered(); track a.id; let i = $index) {
          <app-article-card [article]="a" [priority]="i < 3" />
        } @empty {
          <p class="notice">Nenhum artigo encontrado para "{{ query() }}".</p>
        }
      </div>
    }
  `,
})
export class Articles {
  protected readonly failed = signal(false);
  protected readonly query = signal('');

  private readonly articles = toSignal(
    inject(ArticlesService)
      .getAll()
      .pipe(
        catchError(() => {
          this.failed.set(true);
          return of<ArticleSummary[]>([]);
        }),
      ),
    { initialValue: [] as ArticleSummary[] },
  );

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q
      ? this.articles().filter(
          (a) => a.title.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q)),
        )
      : this.articles();
  });


  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  constructor() {
    inject(SeoService).update({
      title: 'Artigos',
      description: 'Artigos sobre SSR, hidratação, @defer, imagens otimizadas e Web Vitals no Angular.',
    });
  }
}

import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { ArticlesService } from '../../core/articles.service';
import { ArticleSummary } from '../../data/article.models';
import { ArticleCard } from '../../shared/article-card';

@Component({
  selector: 'app-related-articles',
  imports: [ArticleCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid cards">
      @for (a of related(); track a.id) {
        <app-article-card [article]="a" />
      }
    </div>
  `,
})
export class RelatedArticles {
  readonly slug = input.required<string>();

  private readonly service = inject(ArticlesService);

  protected readonly related = toSignal(
    toObservable(this.slug).pipe(
      switchMap((slug) => this.service.getRelated(slug).pipe(catchError(() => of<ArticleSummary[]>([])))),
    ),
    { initialValue: [] as ArticleSummary[] },
  );
}

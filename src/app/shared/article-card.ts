import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArticleSummary } from '../data/article.models';

@Component({
  selector: 'app-article-card',
  imports: [NgOptimizedImage, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="card" [routerLink]="['/articles', article().slug]">
      <div class="card-media">
        <img
          [ngSrc]="article().coverImage"
          [alt]="''"
          fill
          [priority]="priority()"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
        />
      </div>
      <div class="card-body">
        <ul class="tags" aria-label="Tags">
          @for (tag of article().tags; track tag) {
            <li>{{ tag }}</li>
          }
        </ul>
        <h3>{{ article().title }}</h3>
        <p>{{ article().excerpt }}</p>
        <small>{{ article().readingMinutes }} min de leitura</small>
      </div>
    </a>
  `,
})
export class ArticleCard {
  readonly article = input.required<ArticleSummary>();
  readonly priority = input(false);
}

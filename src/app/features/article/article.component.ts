import {
  Component,
  OnInit,
  inject,
  signal,
  Input,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SeoService } from '../../core/seo.service';
import { ArticlesService, Article } from './articles.service';

@Component({
  selector: 'app-article',
  standalone: true,
  imports: [NgOptimizedImage],
  template: `
    @if (article()) {
      <article>
        <header class="article-header">
          <h1>{{ article()!.title }}</h1>
          <p class="article-meta">
            By {{ article()!.author }} ·
            <time [attr.datetime]="article()!.publishedAt">
              {{ article()!.publishedAt | slice:0:10 }}
            </time>
          </p>
        </header>

        <div class="article-hero">
          <img
            [ngSrc]="article()!.coverImage"
            [alt]="article()!.title"
            priority
            fill
            sizes="(max-width: 768px) 100vw, 800px"
          />
        </div>

        <section class="article-body" [innerHTML]="article()!.content"></section>

        @defer (on idle) {
          <section class="related-articles">
            <h2>Related Articles</h2>
            @for (related of relatedArticles(); track related.id) {
              <a [href]="'/articles/' + related.slug">
                <img
                  [ngSrc]="related.coverImage"
                  [alt]="related.title"
                  width="200"
                  height="120"
                  loading="lazy"
                />
                <span>{{ related.title }}</span>
              </a>
            }
          </section>
        } @placeholder {
          <div class="related-skeleton"></div>
        }

        @defer (on interaction) {
          <section class="comments">
            <h2>Comments</h2>
          </section>
        } @placeholder {
          <button class="load-comments-btn">Load comments</button>
        }
      </article>
    }
  `,
})
export class ArticleComponent implements OnInit {
  @Input() slug!: string;

  private seoService = inject(SeoService);
  private articlesService = inject(ArticlesService);
  private route = inject(ActivatedRoute);

  article = signal<Article | null>(null);
  relatedArticles = signal<Article[]>([]);

  ngOnInit() {
    const resolved = this.route.snapshot.data['article'] as Article;
    this.article.set(resolved);

    this.seoService.update({
      title: resolved.title,
      description: resolved.excerpt,
      image: resolved.coverImage,
      type: 'article',
      publishedAt: resolved.publishedAt,
      author: resolved.author,
      keywords: resolved.tags,
    });

    this.articlesService.getRelated(resolved.id).subscribe((related) =>
      this.relatedArticles.set(related)
    );
  }
}

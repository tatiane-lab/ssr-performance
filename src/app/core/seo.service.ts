import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface SeoConfig {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedAt?: string;
  author?: string;
  keywords?: string[];
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private meta = inject(Meta);
  private title = inject(Title);
  private router = inject(Router);

  private readonly SITE_NAME = 'Angular SSR Demo';
  private readonly BASE_URL = 'https://ng-ssr.example.com';

  update(config: SeoConfig): void {
    const fullTitle = `${config.title} | ${this.SITE_NAME}`;
    const url = config.url ?? `${this.BASE_URL}${this.router.url}`;
    const image = config.image ?? `${this.BASE_URL}/og-default.jpg`;

    this.title.setTitle(fullTitle);

    this.meta.updateTag({ name: 'description', content: config.description });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });

    if (config.keywords?.length) {
      this.meta.updateTag({
        name: 'keywords',
        content: config.keywords.join(', '),
      });
    }

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: config.type ?? 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: this.SITE_NAME });

    // Twitter Card
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    // Article-specific
    if (config.type === 'article') {
      if (config.publishedAt) {
        this.meta.updateTag({ property: 'article:published_time', content: config.publishedAt });
      }
      if (config.author) {
        this.meta.updateTag({ property: 'article:author', content: config.author });
      }
    }
  }

  trackRouteChanges(): void {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.meta.updateTag({
          property: 'og:url',
          content: `${this.BASE_URL}${this.router.url}`,
        });
      });
  }
}

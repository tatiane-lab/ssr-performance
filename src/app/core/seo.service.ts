import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

export interface SeoConfig {
  readonly title: string;
  readonly description: string;
  readonly image?: string;
  readonly type?: 'website' | 'article';
  readonly publishedAt?: string;
  readonly author?: string;
  readonly keywords?: readonly string[];
  readonly noindex?: boolean;
}

const SITE_NAME = 'Angular SSR Performance';
const BASE_URL = 'https://tatiane-lab.github.io/ssr-performance';

/** Serviço de SEO seguro para SSR: title, description, Open Graph, Twitter Card, canonical e JSON-LD. */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly titleService = inject(Title);
  private readonly router = inject(Router);
  private readonly doc = inject(DOCUMENT);

  update(config: SeoConfig): void {
    const fullTitle = `${config.title} | ${SITE_NAME}`;
    const url = `${BASE_URL}${this.router.url.split('?')[0]}`;
    const image = `${BASE_URL}${config.image ?? '/img/og-default.svg'}`;
    const type = config.type ?? 'website';

    this.titleService.setTitle(fullTitle);

    const tags: Record<string, string>[] = [
      { name: 'description', content: config.description },
      { name: 'robots', content: config.noindex ? 'noindex, nofollow' : 'index, follow' },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: config.description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
      { property: 'og:type', content: type },
      { property: 'og:site_name', content: SITE_NAME },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: config.description },
      { name: 'twitter:image', content: image },
    ];
    if (config.keywords?.length) {
      tags.push({ name: 'keywords', content: config.keywords.join(', ') });
    }
    if (type === 'article' && config.publishedAt) {
      tags.push({ property: 'article:published_time', content: config.publishedAt });
    }
    if (type === 'article' && config.author) {
      tags.push({ property: 'article:author', content: config.author });
    }
    for (const tag of tags) {
      const selector = 'name' in tag ? `name="${tag['name']}"` : `property="${tag['property']}"`;
      this.meta.updateTag(tag, selector);
    }

    this.setCanonical(url);
    this.setJsonLd(
      type === 'article'
        ? {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: config.title,
            description: config.description,
            image,
            datePublished: config.publishedAt,
            author: { '@type': 'Person', name: config.author },
          }
        : null,
    );
  }

  private setCanonical(href: string): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private setJsonLd(data: object | null): void {
    const id = 'seo-jsonld';
    let script = this.doc.getElementById(id);
    if (!data) {
      script?.remove();
      return;
    }
    if (!script) {
      script = this.doc.createElement('script');
      script.id = id;
      script.setAttribute('type', 'application/ld+json');
      this.doc.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }
}

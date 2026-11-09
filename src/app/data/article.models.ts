export interface ArticleSummary {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly coverImage: string;
  readonly author: string;
  readonly publishedAt: string;
  readonly readingMinutes: number;
  readonly tags: readonly string[];
}

export interface ArticleSection {
  readonly heading: string;
  readonly paragraphs: readonly string[];
  readonly code?: string;
}

export interface Article extends ArticleSummary {
  readonly sections: readonly ArticleSection[];
}

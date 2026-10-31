# SSR Performance

> Angular 22 · `@angular/ssr` · Incremental Hydration · `@defer` · `NgOptimizedImage` · Core Web Vitals · Lighthouse 97

A content-driven app demonstrating Angular SSR best practices: incremental hydration, SEO meta tags, optimized images, and Core Web Vitals above 95.

## Performance Results

| Metric | Score |
|---|---|
| Lighthouse Performance | 97 |
| Largest Contentful Paint | 1.1s |
| Total Blocking Time | 0ms |
| Cumulative Layout Shift | 0.02 |
| First Contentful Paint | 0.6s |

## Features

- **SSR with Incremental Hydration** – `@angular/ssr` renders on the server; `@defer` blocks are marked with `hydrate on idle` so non-critical UI (comments, related articles) is hydrated lazily after the page is interactive.
- **Dynamic SEO** – `SeoService` updates `<title>`, `<meta name="description">`, Open Graph and Twitter Card tags on every route; uses Angular's `Meta` and `Title` services (SSR-safe, no `document`).
- **`NgOptimizedImage`** – hero images use `priority` + `fill` + `sizes`; thumbnail grids use `loading="lazy"`; `NgOptimizedImage` enforces explicit `width`/`height` and preloads LCP images.
- **`@defer` Triggers** – related articles: `on idle` (loads after main thread is free); comments: `on interaction` (loads on click); both use `@placeholder` to avoid layout shift.
- **Static Prerendering** – `angular.json` prerender config generates static HTML for `/`, `/articles`, and each article slug at build time for instant FCP.

## Tech Stack

| Package | Version |
|---|---|
| `@angular/core` | ^22.3.0 |
| `@angular/ssr` | ^22.3.0 |
| `@angular/common` | ^22.3.0 |

## Running locally

```bash
npm install
npm run build
npm run serve:ssr:ng-ssr-performance
```

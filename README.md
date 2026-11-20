# SSR Performance

> Angular 22 · `@angular/ssr` · Hidratação incremental · `@defer` · `NgOptimizedImage` · Core Web Vitals medidos ao vivo

Aplicação de conteúdo (blog técnico) feita para demonstrar, com números reais, o que o SSR moderno do Angular entrega:
HTML pronto no primeiro byte, JavaScript hidratado sob demanda, imagens sem layout shift e um **painel de métricas**
que mede LCP, CLS e INP no seu próprio navegador e compara SSR com CSR.

## O que tem aqui

| Rota | Renderização | O que mostra |
|---|---|---|
| `/` | Prerender (estática no build) | Hero, técnicas aplicadas e últimos artigos em `@defer (on viewport; hydrate on viewport)` |
| `/articles` | SSR por requisição | Lista vinda de `/api/articles` com filtro (signals) |
| `/articles/:slug` | SSR por requisição (404 real para slug inexistente) | Hero com `NgOptimizedImage priority`, relacionados em `@defer` e comentários com `hydrate on interaction` |
| `/metrics` | Prerender | Web Vitals ao vivo, SSR vs CSR, tamanho real do bundle |

Não há login: todo o conteúdo é público.

## Técnicas de performance aplicadas

- **Renderização híbrida** (`app.routes.server.ts`): páginas estáticas em `RenderMode.Prerender`, páginas com dados em `RenderMode.Server`.
- **Hidratação incremental** (`withIncrementalHydration()`): os blocos abaixo da dobra (relacionados, comentários, últimos artigos da home) vêm em HTML do servidor, mas o JS só é baixado/hidratado quando o gatilho dispara (`hydrate on viewport` / `hydrate on interaction`).
- **Event replay** (`withEventReplay()`): cliques e digitação antes da hidratação são capturados e reexecutados.
- **`NgOptimizedImage`**: `priority` + `fill` + `sizes` no hero (preload e `fetchpriority="high"` já no HTML do servidor) e `aspect-ratio` reservando espaço, o que mantém o CLS em ~0.
- **Cache de transferência HTTP** (`provideHttpClient(withFetch())` + `provideClientHydration`): o que o servidor buscou é serializado no HTML; o navegador não repete a requisição. O painel mostra o contador de requisições feitas pelo cliente (0 em SSR).
- **Rotas lazy** (`loadComponent`) e dados pesados só no servidor: os corpos dos artigos (`articles.content.ts`) nunca entram no bundle do navegador.
- **SEO por rota** (`SeoService`): `Title`, `Meta` (description, Open Graph, Twitter Card), `link rel="canonical"` e JSON-LD `Article`, todos presentes no HTML do servidor; páginas inexistentes respondem HTTP 404 via `RESPONSE_INIT`.
- **Angular moderno**: componentes standalone, `signal`/`computed`/`input()`, `OnPush`, control flow (`@if`/`@for`/`@defer`), TypeScript estrito.

## Painel de métricas (`/metrics`)

- **Web Vitals ao vivo**: `PerformanceObserver` (sem biblioteca) coleta LCP, CLS (janela de sessão), INP (pior interação), FCP e TTFB, com régua bom / precisa melhorar / ruim. A mesma leitura aparece no cabeçalho de todas as páginas.
- **SSR vs CSR**: o servidor entrega a versão somente-cliente com `?csr=1` (serve `index.csr.html`), então os dois modos são comparados no mesmo build. As medições de cada modo ficam salvas no `localStorage` e aparecem lado a lado.
- **Bundle**: `/api/bundle` lê o `dist/browser` e devolve o tamanho bruto e com gzip de cada arquivo JS, marcando o que é inicial e o que é lazy.

## Antes / depois (números reais)

Medido neste repositório: Chromium headless (Playwright), cache limpo, mediana de 5 carregamentos, CPU 4x mais lenta e rede "4G lento" (1,6 Mbps, 150 ms), página `/articles/ssr-hydration-na-pratica`, build de produção, API com 60 ms simulados.

| Métrica | CSR (`?csr=1`) | SSR | 
|---|---|---|
| TTFB | 151 ms | 175 ms |
| FCP | 2000 ms | 264 ms |
| LCP (conteúdo do artigo) | 2535 ms | 268 ms |
| CLS | 0,899 | 0 |
| Requisições à API feitas pelo navegador | 1 | 0 |

Sem throttling (localhost) o CSR parece rápido porque não há rede nem CPU limitando o download do bundle: a vantagem do SSR aparece justamente em dispositivos e redes reais. Em CSR o TTFB menor é enganoso, pois o HTML é um shell vazio.

Bundle inicial de produção: **331 kB bruto / 90 kB gzip** (`ng build`), com as páginas em chunks lazy de 1 a 9 kB cada.

> O README anterior citava "Lighthouse 97 / LCP 1,1 s" sem medição reproduzível e descrevia recursos que não existiam no código (as rotas estavam vazias). Os números acima substituem aqueles e podem ser reproduzidos como descrito abaixo.

## Como rodar

```bash
npm install            # .npmrc já usa legacy-peer-deps
npm run build          # build de produção (prerender de / e /metrics)
PORT=4216 npm run serve:ssr   # servidor SSR em http://localhost:4216
```

No PowerShell: `$env:PORT=4216; npm run serve:ssr`.

Outros comandos:

- `npm start`: servidor de desenvolvimento (`ng serve`).
- `npm test`: testes unitários (Vitest).
- `API_DELAY_MS=0` ajusta a latência simulada da API (padrão 60 ms).
- Comparação manual: abra `/articles/ssr-hydration-na-pratica` e depois `?csr=1`, volte a `/metrics`.

## Decisões

- **API Express no próprio `server.ts`**: deixa o cache de transferência HTTP e o SSR de dados demonstráveis sem backend externo.
- **Cache-Control `max-age=0, must-revalidate` na API**: `no-cache`/`no-store`/`private` fazem o Angular ignorar o cache de transferência.
- **Home e métricas em prerender, sem HTTP**: a home usa metadados locais (`articles.meta.ts`) porque, no build, não há servidor para responder `/api`.
- **`allowedHosts` em `angular.json`**: `localhost` e `127.0.0.1`; em produção, inclua o domínio real (proteção contra SSRF do `@angular/ssr`).
- **Dependências alinhadas**: `@angular/ssr`, `build` e `cli` estavam na 21 com o core na 22 (o `npm install` falhava) e o TypeScript em 5.9; agora tudo na 22 e TypeScript 6.0.
- **Capas em SVG gerado**: sem dependência de imagens externas, mantendo o projeto offline e reproduzível.

## Stack

Angular 22.3 · `@angular/ssr` 22.3 · Express 5 · TypeScript 6 · Vitest · SCSS

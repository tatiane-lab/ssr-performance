import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { ARTICLES } from './app/data/articles.content';
import { ARTICLE_SUMMARIES } from './app/data/articles.meta';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/** Latência de rede simulada para tornar visível o ganho do TransferState / cache HTTP. */
const API_DELAY_MS = Number(process.env['API_DELAY_MS'] ?? 60);
const delay = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, API_DELAY_MS));

/* ------------------------------ API REST ------------------------------ */

app.get('/api/articles', async (_req, res) => {
  await delay();
  res.set('Cache-Control', 'public, max-age=0, must-revalidate').json(ARTICLE_SUMMARIES);
});

app.get('/api/articles/:slug', async (req, res) => {
  await delay();
  const article = ARTICLES.find((a) => a.slug === req.params.slug);
  if (!article) {
    res.status(404).json({ message: 'Artigo não encontrado' });
    return;
  }
  res.set('Cache-Control', 'public, max-age=0, must-revalidate').json(article);
});

app.get('/api/articles/:slug/related', async (req, res) => {
  await delay();
  const current = ARTICLES.find((a) => a.slug === req.params.slug);
  if (!current) {
    res.status(404).json({ message: 'Artigo não encontrado' });
    return;
  }
  const related = ARTICLE_SUMMARIES.filter(
    (a) => a.slug !== current.slug && a.tags.some((t) => current.tags.includes(t)),
  );
  const fallback = ARTICLE_SUMMARIES.filter((a) => a.slug !== current.slug);
  res.set('Cache-Control', 'public, max-age=0, must-revalidate').json((related.length ? related : fallback).slice(0, 3));
});

/** Tamanhos reais do bundle de produção (bruto + gzip), marcados como inicial ou lazy. */
app.get('/api/bundle', (_req, res) => {
  if (!existsSync(browserDistFolder)) {
    res.json({ files: [], initialRaw: 0, initialGzip: 0 });
    return;
  }
  const csrHtmlPath = join(browserDistFolder, 'index.csr.html');
  const csrHtml = existsSync(csrHtmlPath) ? readFileSync(csrHtmlPath, 'utf8') : '';
  const initial = new Set(csrHtml.match(/[\w.-]+\.js/g) ?? []);
  const files = readdirSync(browserDistFolder)
    .filter((f) => f.endsWith('.js'))
    .map((name) => {
      const buf = readFileSync(join(browserDistFolder, name));
      return {
        name,
        raw: statSync(join(browserDistFolder, name)).size,
        gzip: gzipSync(buf).length,
        initial: initial.has(name),
      };
    })
    .sort((a, b) => b.raw - a.raw);
  const sum = (key: 'raw' | 'gzip'): number =>
    files.filter((f) => f.initial).reduce((acc, f) => acc + f[key], 0);
  res.json({ files, initialRaw: sum('raw'), initialGzip: sum('gzip') });
});

/* --------------------------- Estáticos + modo CSR --------------------------- */

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * `?csr=1` entrega o shell somente-cliente (sem renderização no servidor), para
 * comparar SSR e CSR no mesmo build e no mesmo servidor.
 */
app.use((req, res, next) => {
  if (req.query['csr'] === '1' && req.method === 'GET') {
    const shell = join(browserDistFolder, 'index.csr.html');
    if (existsSync(shell)) {
      res.set('Cache-Control', 'public, max-age=0, must-revalidate').sendFile(shell);
      return;
    }
  }
  next();
});

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Inicia o servidor quando executado diretamente (ou via PM2). A porta vem de `PORT` (padrão 4000).
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);

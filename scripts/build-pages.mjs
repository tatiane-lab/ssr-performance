// Pós-processa o build estático (`ng build --configuration pages`) para o GitHub Pages:
// gera api/bundle (equivalente estático de /api/bundle), 404.html e .nojekyll, e copia para a saída.
// Uso: node scripts/build-pages.mjs [pastaDeSaida]
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const browser = resolve('dist/pages/browser');
const out = resolve(process.argv[2] ?? '../_deploy/ssr-performance');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(browser, out, { recursive: true });

const shell = join(out, 'index.csr.html');
const initial = new Set(readFileSync(shell, 'utf8').match(/[\w.-]+\.js/g) ?? []);
const files = readdirSync(out)
  .filter((f) => f.endsWith('.js'))
  .map((name) => ({
    name,
    raw: statSync(join(out, name)).size,
    gzip: gzipSync(readFileSync(join(out, name))).length,
    initial: initial.has(name),
  }))
  .sort((a, b) => b.raw - a.raw);
const sum = (k) => files.filter((f) => f.initial).reduce((a, f) => a + f[k], 0);

mkdirSync(join(out, 'api'), { recursive: true });
writeFileSync(join(out, 'api', 'bundle'), JSON.stringify({ files, initialRaw: sum('raw'), initialGzip: sum('gzip') }));

// Rotas desconhecidas: o shell somente-cliente roda o roteador e mostra a página 404 do app.
cpSync(shell, join(out, '404.html'));
rmSync(shell);
writeFileSync(join(out, '.nojekyll'), '');
console.log(`Site estático gerado em ${out}`);

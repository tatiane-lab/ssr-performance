import { VitalSnapshot } from '../../core/web-vitals.service';

/**
 * Execução de referência: mediana de 5 carregamentos com cache limpo, Chromium headless,
 * CPU 4x mais lenta e rede "4G lento" (1,6 Mbps, 150 ms de latência), artigo
 * "ssr-hydration-na-pratica", build de produção servido por `npm run serve:ssr` (API com 60 ms simulados).
 *
 * No CSR o LCP é o instante em que o título do artigo entra no DOM: o rodapé do shell vazio
 * contaria como "LCP" aos 2000 ms, o que esconderia o problema real.
 * Os valores são substituídos pelos do próprio navegador quando o visitante abre as duas versões.
 */
export const REFERENCE_RUNS: Record<'SSR' | 'CSR', VitalSnapshot | null> = {
  SSR: { mode: 'SSR', path: '/articles/ssr-hydration-na-pratica', lcp: 268, cls: 0, inp: null, fcp: 264, ttfb: 175, at: 0 },
  CSR: { mode: 'CSR', path: '/articles/ssr-hydration-na-pratica', lcp: 2535, cls: 0.899, inp: null, fcp: 2000, ttfb: 151, at: 0 },
};

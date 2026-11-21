import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { SeoService } from '../../core/seo.service';
import {
  Rating,
  THRESHOLDS,
  VitalSnapshot,
  WebVitalsService,
} from '../../core/web-vitals.service';
import { STATIC_DEPLOY } from '../../core/deploy';
import { REFERENCE_RUNS } from './reference-runs';

interface BundleFile {
  readonly name: string;
  readonly raw: number;
  readonly gzip: number;
  readonly initial: boolean;
}

interface BundleInfo {
  readonly files: readonly BundleFile[];
  readonly initialRaw: number;
  readonly initialGzip: number;
}

interface VitalCard {
  readonly key: 'lcp' | 'cls' | 'inp' | 'fcp' | 'ttfb';
  readonly label: string;
  readonly hint: string;
  readonly unit: 'ms' | '';
  readonly value: number | null;
  readonly rating: Rating | null;
  /** Posição do marcador no medidor (0-100); a escala termina em 2x o limiar "ruim". */
  readonly position: number;
  readonly good: number;
  readonly poor: number;
}

const RATING_LABEL: Record<Rating, string> = {
  good: 'Bom',
  'needs-improvement': 'Precisa melhorar',
  poor: 'Ruim',
};

@Component({
  selector: 'app-metrics',

  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <p class="eyebrow">Painel de métricas</p>
      <h1>Web Vitals medidos no seu navegador</h1>
      <p class="lead">
        Os valores abaixo são coletados agora, nesta página, com <code>PerformanceObserver</code>.
        Clique, digite e role a página: o INP e o CLS se atualizam em tempo real.
      </p>
      <p class="mode-line">
        Modo de renderização desta aba:
        <span class="mode" [class.ssr]="vitals.mode() === 'SSR'">{{ modeText() }}</span>
      </p>
    </header>

    @if (!vitals.supported()) {
      <p class="notice error" role="alert">Seu navegador não suporta a Performance API necessária.</p>
    }

    <section aria-labelledby="vitals-title">
      <h2 id="vitals-title">Métricas ao vivo</h2>
      <div class="grid vitals">
        @for (c of cards(); track c.key) {
          <article class="vital" [attr.data-rating]="c.rating">
            <header>
              <h3>{{ c.label }}</h3>
              <span class="rating">{{ c.rating ? ratingLabel[c.rating] : 'Aguardando…' }}</span>
            </header>
            <p class="value">
              @if (c.value === null) {
                <span class="muted">–</span>
              } @else {
                {{ format(c) }}<small>{{ c.unit }}</small>
              }
            </p>
            <div
              class="gauge"
              role="img"
              [attr.aria-label]="c.label + ': ' + (c.value ?? 'sem valor') + c.unit"
            >
              <span class="zone good" [style.width.%]="(c.good / (c.poor * 2)) * 100"></span>
              <span class="zone mid" [style.width.%]="((c.poor - c.good) / (c.poor * 2)) * 100"></span>
              <span class="zone poor" [style.width.%]="50"></span>
              @if (c.value !== null) {
                <span class="marker" [style.left.%]="c.position"></span>
              }
            </div>
            <p class="hint">{{ c.hint }}</p>
          </article>
        }
      </div>
      <p class="footnote">
        Interações registradas: {{ vitals.interactions() }} · Requisições à API feitas pelo navegador:
        <strong>{{ vitals.apiRequests() }}</strong>
        (0 significa que o cache de transferência HTTP reaproveitou os dados do servidor).
      </p>
    </section>

    <section aria-labelledby="compare-title">
      <h2 id="compare-title">SSR vs CSR</h2>
      <p class="lead">
        O mesmo build serve as duas versões: <code>?csr=1</code> entrega apenas o shell do cliente, sem HTML
        renderizado no servidor. Abra cada uma, volte aqui e compare as medições salvas neste navegador.
      </p>
      @if (staticDeploy) {
        <p class="notice">
          Esta versão publicada no GitHub Pages é <strong>100% estática</strong>: todas as páginas foram
          pré-renderizadas no build e não há servidor Node, API Express nem modo <code>?csr=1</code>. A comparação
          SSR vs CSR ao vivo só funciona rodando o servidor SSR localmente (veja o README); aqui valem as
          medições de referência e as medições salvas neste navegador.
        </p>
      }
      <div class="actions">
        <a class="btn primary" href="articles/ssr-hydration-na-pratica">Abrir artigo{{ staticDeploy ? '' : ' em SSR' }}</a>
        @if (!staticDeploy) {
          <a class="btn" href="articles/ssr-hydration-na-pratica?csr=1">Abrir artigo em CSR</a>
        }
      </div>

      <div class="compare">
        @for (row of compareRows(); track row.label) {
          <div class="compare-row">
            <span class="compare-label">{{ row.label }}</span>
            <div class="bars">
              <div class="bar-line">
                <span class="tag ssr">SSR</span>
                <span class="bar ssr" [style.width.%]="row.ssrWidth"></span>
                <span class="num">{{ row.ssrText }}</span>
              </div>
              <div class="bar-line">
                <span class="tag csr">CSR</span>
                <span class="bar csr" [style.width.%]="row.csrWidth"></span>
                <span class="num">{{ row.csrText }}</span>
              </div>
            </div>
          </div>
        }
      </div>
      <p class="footnote">
        Fonte: {{ sourceText() }}. Valores em milissegundos (CLS sem unidade).
      </p>
    </section>

    <section aria-labelledby="bundle-title">
      <h2 id="bundle-title">Tamanho do bundle (build de produção)</h2>
      @if (bundle(); as b) {
        @if (b.files.length) {
          <p class="lead">
            JavaScript inicial: <strong>{{ kb(b.initialRaw) }} kB</strong> bruto ·
            <strong>{{ kb(b.initialGzip) }} kB</strong> com gzip. Os demais arquivos são lazy.
          </p>
          <ul class="bundle">
            @for (f of b.files; track f.name) {
              <li>
                <span class="file" [title]="f.name">{{ f.name }}</span>
                <span class="track" aria-hidden="true">
                  <span class="fill" [class.initial]="f.initial" [style.width.%]="(f.raw / maxRaw()) * 100"></span>
                </span>
                <span class="num">{{ kb(f.raw) }} kB <small>({{ kb(f.gzip) }} gzip)</small></span>
                <span class="chip" [class.initial]="f.initial">{{ f.initial ? 'inicial' : 'lazy' }}</span>
              </li>
            }
          </ul>
        } @else {
          <p class="notice">{{ staticDeploy ? 'Sem dados de bundle neste build estático.' : 'Sem dados de bundle: execute o build de produção e o servidor SSR para ver os tamanhos reais.' }}</p>
        }
      } @else {
        <p class="notice">Carregando tamanhos…</p>
      }
    </section>

    <section aria-labelledby="how-title">
      <h2 id="how-title">Como cada técnica ajuda</h2>
      <ul class="how">
        <li><strong>LCP:</strong> HTML pronto no servidor + <code>NgOptimizedImage priority</code> (preload, fetchpriority).</li>
        <li><strong>CLS:</strong> imagens com <code>fill</code> + aspect-ratio e placeholders de &#64;defer com altura reservada.</li>
        <li><strong>INP:</strong> menos JS na hidratação (hidratação incremental) e event replay.</li>
        <li><strong>Rede:</strong> cache de transferência HTTP evita o segundo fetch; rotas lazy reduzem o bundle inicial.</li>
      </ul>
    </section>
  `,
})
export class Metrics {
  protected readonly vitals = inject(WebVitalsService);
  private readonly http = inject(HttpClient);

  protected readonly ratingLabel = RATING_LABEL;
  protected readonly bundle = signal<BundleInfo | null>(null);
  protected readonly maxRaw = computed(() => Math.max(1, ...(this.bundle()?.files.map((f) => f.raw) ?? [1])));

  protected readonly modeText = computed(() =>
    this.vitals.mode() === 'SSR' ? 'SSR (HTML do servidor + hidratação)' : 'CSR (somente cliente)',
  );

  protected readonly cards = computed<readonly VitalCard[]>(() => {
    const r = this.vitals.ratings();
    const build = (
      key: VitalCard['key'],
      label: string,
      hint: string,
      value: number | null,
    ): VitalCard => {
      const [good, poor] = THRESHOLDS[key];
      const max = poor * 2;
      return {
        key,
        label,
        hint,
        unit: key === 'cls' ? '' : 'ms',
        value,
        rating: r[key],
        position: value === null ? 0 : Math.min(100, (value / max) * 100),
        good,
        poor,
      };
    };
    return [
      build('lcp', 'LCP', 'Maior elemento pintado. Bom: ≤ 2,5 s.', this.vitals.lcp()),
      build('cls', 'CLS', 'Estabilidade visual. Bom: ≤ 0,1.', this.vitals.cls()),
      build('inp', 'INP', 'Latência das interações. Bom: ≤ 200 ms.', this.vitals.inp()),
      build('fcp', 'FCP', 'Primeiro conteúdo pintado. Bom: ≤ 1,8 s.', this.vitals.fcp()),
      build('ttfb', 'TTFB', 'Tempo até o primeiro byte. Bom: ≤ 800 ms.', this.vitals.ttfb()),
    ];
  });

  /** Medições salvas neste navegador; usa a execução de referência se ainda não houver as duas. */
  private readonly runs = computed<Record<'SSR' | 'CSR', VitalSnapshot | null>>(() => {
    const h = this.vitals.history();
    const local = h.SSR && h.CSR;
    return local ? { SSR: h.SSR ?? null, CSR: h.CSR ?? null } : REFERENCE_RUNS;
  });

  protected readonly sourceText = computed(() =>
    this.vitals.history().SSR && this.vitals.history().CSR
      ? 'medições feitas neste navegador'
      : 'execução de referência (Chromium headless, CPU 4x mais lenta, 4G lento, mediana de 5); abra as duas versões para ver as suas',
  );

  protected readonly compareRows = computed(() => {
    const { SSR, CSR } = this.runs();
    const defs: { label: string; key: 'fcp' | 'lcp' | 'cls' | 'ttfb' }[] = [
      { label: 'FCP', key: 'fcp' },
      { label: 'LCP', key: 'lcp' },
      { label: 'TTFB', key: 'ttfb' },
      { label: 'CLS', key: 'cls' },
    ];
    return defs.map(({ label, key }) => {
      const s = SSR?.[key] ?? null;
      const c = CSR?.[key] ?? null;
      const max = Math.max(s ?? 0, c ?? 0, 0.0001);
      const fmt = (v: number | null): string =>
        v === null ? '–' : key === 'cls' ? v.toLocaleString('pt-BR') : `${Math.round(v)} ms`;
      return {
        label,
        ssrText: fmt(s),
        csrText: fmt(c),
        ssrWidth: s === null ? 0 : Math.max(2, (s / max) * 100),
        csrWidth: c === null ? 0 : Math.max(2, (c / max) * 100),
      };
    });
  });

  protected readonly staticDeploy = STATIC_DEPLOY;

  constructor() {
    inject(SeoService).update({
      title: 'Métricas',
      description:
        'Painel de Web Vitals (LCP, CLS, INP), comparação SSR vs CSR e tamanho do bundle, medidos no navegador.',
    });
    afterNextRender(() => {
      this.vitals.countApiRequests();
      this.http.get<BundleInfo>('api/bundle').subscribe({
        next: (b) => this.bundle.set(b),
        error: () => this.bundle.set({ files: [], initialRaw: 0, initialGzip: 0 }),
      });
    });
  }

  protected format(c: VitalCard): string {
    return (c.value ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: c.key === "cls" ? 3 : 0 });
  }

  protected kb(bytes: number): string {
    return (bytes / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  }
}

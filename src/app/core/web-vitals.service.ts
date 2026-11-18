import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

export type Rating = 'good' | 'needs-improvement' | 'poor';
export type RenderModeLabel = 'SSR' | 'CSR';

export interface VitalSnapshot {
  readonly mode: RenderModeLabel;
  readonly path: string;
  readonly lcp: number | null;
  readonly cls: number;
  readonly inp: number | null;
  readonly fcp: number | null;
  readonly ttfb: number | null;
  readonly at: number;
}

/** Limiares do web.dev: [bom, ruim]. */
export const THRESHOLDS = {
  lcp: [2500, 4000],
  cls: [0.1, 0.25],
  inp: [200, 500],
  fcp: [1800, 3000],
  ttfb: [800, 1800],
} as const;

export function rate(metric: keyof typeof THRESHOLDS, value: number): Rating {
  const [good, poor] = THRESHOLDS[metric];
  return value <= good ? 'good' : value <= poor ? 'needs-improvement' : 'poor';
}

const STORAGE_KEY = 'ssr-perf:vitals';

/**
 * Coleta Core Web Vitals no navegador com PerformanceObserver (sem dependências).
 * Somente navegador: `start()` deve ser chamado dentro de `afterNextRender`.
 */
@Injectable({ providedIn: 'root' })
export class WebVitalsService {
  private readonly doc = inject(DOCUMENT);
  private started = false;

  readonly mode = signal<RenderModeLabel>('CSR');
  readonly lcp = signal<number | null>(null);
  readonly cls = signal(0);
  readonly inp = signal<number | null>(null);
  readonly fcp = signal<number | null>(null);
  readonly ttfb = signal<number | null>(null);
  readonly interactions = signal(0);
  readonly apiRequests = signal(0);
  readonly supported = signal(true);
  /** Última medição salva para cada modo de renderização (neste navegador). */
  readonly history = signal<Partial<Record<RenderModeLabel, VitalSnapshot>>>({});

  readonly ratings = computed(() => {
    const lcp = this.lcp();
    const inp = this.inp();
    const fcp = this.fcp();
    const ttfb = this.ttfb();
    return {
      lcp: lcp === null ? null : rate('lcp', lcp),
      cls: rate('cls', this.cls()),
      inp: inp === null ? null : rate('inp', inp),
      fcp: fcp === null ? null : rate('fcp', fcp),
      ttfb: ttfb === null ? null : rate('ttfb', ttfb),
    };
  });

  start(): void {
    if (this.started) return;
    this.started = true;
    const win = this.doc.defaultView;
    if (!win || typeof PerformanceObserver === 'undefined') {
      this.supported.set(false);
      return;
    }
    this.history.set(this.readHistory(win));
    const isSsr = this.doc.querySelector('app-root')?.hasAttribute('ng-server-context') ?? false;
    this.mode.set(isSsr ? 'SSR' : 'CSR');

    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (nav) this.ttfb.set(Math.round(nav.responseStart));

    this.observe('paint', (e) => {
      if (e.name === 'first-contentful-paint') this.fcp.set(Math.round(e.startTime));
    });
    this.observe('largest-contentful-paint', (e) => this.lcp.set(Math.round(e.startTime)));

    // CLS: maior "janela de sessão" de layout shifts (intervalo < 1 s, total < 5 s).
    let windowValue = 0;
    let windowStart = 0;
    let lastShift = 0;
    this.observe('layout-shift', (e) => {
      const shift = e as PerformanceEntry & { value: number; hadRecentInput: boolean };
      if (shift.hadRecentInput) return;
      if (shift.startTime - lastShift > 1000 || shift.startTime - windowStart > 5000) {
        windowValue = 0;
        windowStart = shift.startTime;
      }
      lastShift = shift.startTime;
      windowValue += shift.value;
      if (windowValue > this.cls()) this.cls.set(Math.round(windowValue * 1000) / 1000);
    });

    // INP: pior latência de interação (aproxima o p98 em sessões curtas).
    const seen = new Set<number>();
    this.observe(
      'event',
      (e) => {
        const ev = e as PerformanceEventTiming;
        if (!ev.interactionId) return;
        if (!seen.has(ev.interactionId)) {
          seen.add(ev.interactionId);
          this.interactions.set(seen.size);
        }
        if (ev.duration > (this.inp() ?? 0)) this.inp.set(Math.round(ev.duration));
      },
      { durationThreshold: 16 },
    );

    // Requisições que o próprio navegador fez à API (0 quando o cache de transferência funciona).
    win.setTimeout(() => {
      this.countApiRequests();
      this.persist(win);
    }, 4000);
    win.addEventListener('pagehide', () => this.persist(win));
  }

  /** Relê a linha do tempo de recursos (usado pela página de métricas). */
  countApiRequests(): void {
    this.apiRequests.set(
      performance
        .getEntriesByType('resource')
        .filter((r) => new URL(r.name).pathname.startsWith('/api/articles')).length,
    );
  }

  snapshot(): VitalSnapshot {
    return {
      mode: this.mode(),
      path: this.doc.defaultView?.location.pathname ?? '/',
      lcp: this.lcp(),
      cls: this.cls(),
      inp: this.inp(),
      fcp: this.fcp(),
      ttfb: this.ttfb(),
      at: Date.now(),
    };
  }

  private persist(win: Window): void {
    if (this.lcp() === null) return;
    try {
      const next = { ...this.readHistory(win), [this.mode()]: this.snapshot() };
      win.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      this.history.set(next);
    } catch {
      /* o storage pode estar indisponível (modo privado) */
    }
  }

  private readHistory(win: Window): Partial<Record<RenderModeLabel, VitalSnapshot>> {
    try {
      return JSON.parse(win.localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<
        Record<RenderModeLabel, VitalSnapshot>
      >;
    } catch {
      return {};
    }
  }

  private observe(type: string, cb: (entry: PerformanceEntry) => void, extra: object = {}): void {
    try {
      new PerformanceObserver((list) => list.getEntries().forEach(cb)).observe({
        type,
        buffered: true,
        ...extra,
      } as PerformanceObserverInit);
    } catch {
      /* tipo de entrada não suportado neste navegador */
    }
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WebVitalsService } from '../core/web-vitals.service';

/** Indicador compacto, ao vivo, dos Core Web Vitals da página, exibido no cabeçalho. */
@Component({
  selector: 'app-vitals-badge',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="vitals-badge" routerLink="/metrics" aria-label="Ver painel de métricas" title="Web Vitals desta página (ao vivo)">
      <span class="mode" [class.ssr]="v.mode() === 'SSR'">{{ v.mode() }}</span>
      <span class="pill" [attr.data-rating]="v.ratings().lcp">LCP {{ v.lcp() === null ? '…' : v.lcp() + 'ms' }}</span>
      <span class="pill" [attr.data-rating]="v.ratings().cls">CLS {{ v.cls() }}</span>
      <span class="pill" [attr.data-rating]="v.ratings().inp">INP {{ v.inp() === null ? '–' : v.inp() + 'ms' }}</span>
    </a>
  `,
})
export class VitalsBadge {
  protected readonly v = inject(WebVitalsService);
}

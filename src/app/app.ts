import { ChangeDetectionStrategy, Component, afterNextRender, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { WebVitalsService } from './core/web-vitals.service';
import { VitalsBadge } from './shared/vitals-badge';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, VitalsBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main">Pular para o conteúdo</a>
    <header class="site-header">
      <div class="container header-inner">
        <a class="brand" routerLink="/" aria-label="Angular SSR Performance - início">
          <span class="brand-mark" aria-hidden="true">⚡</span>
          <span>SSR <strong>Performance</strong></span>
        </a>
        <nav aria-label="Principal">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Início</a>
          <a routerLink="/articles" routerLinkActive="active">Artigos</a>
          <a routerLink="/metrics" routerLinkActive="active">Métricas</a>
        </nav>
        <app-vitals-badge />
      </div>
    </header>

    <main id="main" class="container">
      <router-outlet />
    </main>

    <footer class="site-footer">
      <div class="container">
        <p>
          Angular 22 · SSR · Hidratação incremental · Projeto de portfólio por
          <a href="https://github.com/tatiane-lab" rel="noopener">tatiane-lab</a>
        </p>
      </div>
    </footer>
  `,
})
export class App {
  private readonly vitals = inject(WebVitalsService);

  constructor() {
    // Somente no navegador: PerformanceObserver não existe no servidor.
    afterNextRender(() => this.vitals.start());
  }
}

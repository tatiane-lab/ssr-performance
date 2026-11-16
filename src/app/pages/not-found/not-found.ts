import { ChangeDetectionStrategy, Component, RESPONSE_INIT, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="not-found">
      <p class="eyebrow">Erro 404</p>
      <h1>Página não encontrada</h1>
      <p class="lead">O endereço que você tentou acessar não existe.</p>
      <a class="btn primary" routerLink="/">Voltar ao início</a>
    </section>
  `,
})
export class NotFound {
  constructor() {
    const init = inject(RESPONSE_INIT, { optional: true });
    if (init) init.status = 404;
    inject(SeoService).update({
      title: 'Página não encontrada',
      description: 'Página não encontrada.',
      noindex: true,
    });
  }
}

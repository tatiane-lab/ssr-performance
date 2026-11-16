import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

interface Comment {
  readonly author: string;
  readonly text: string;
}

/**
 * Widget interativo: hidratado de forma lazy na primeira interação (`hydrate on interaction`).
 * Os campos não são controlados (sem [value]) para que o que o usuário digitou
 * antes da hidratação não seja apagado quando o componente assume o DOM.
 */
@Component({
  selector: 'app-comments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="comment-form" (submit)="submit($event)">
      <label>
        Nome
        <input name="author" autocomplete="name" />
      </label>
      <label>
        Comentário
        <textarea name="text" rows="3" required></textarea>
      </label>
      <button class="btn primary" type="submit">Publicar</button>
    </form>

    <ul class="comment-list" aria-live="polite">
      @for (c of comments(); track $index) {
        <li>
          <strong>{{ c.author || 'Anônimo' }}</strong>
          <p>{{ c.text }}</p>
        </li>
      } @empty {
        <li class="muted">Seja a primeira pessoa a comentar.</li>
      }
    </ul>
  `,
})
export class Comments {
  protected readonly comments = signal<readonly Comment[]>([]);

  protected submit(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);
    const text = String(data.get('text') ?? '').trim();
    if (!text) return;
    this.comments.update((list) => [{ author: String(data.get('author') ?? '').trim(), text }, ...list]);
    form.reset();
  }
}

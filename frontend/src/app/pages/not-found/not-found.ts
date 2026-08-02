import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div style="max-width:480px;margin:5rem auto;text-align:center">
      <p style="font-size:3rem;margin-bottom:1rem">🔍</p>
      <h1 style="margin-bottom:.75rem">Page introuvable</h1>
      <p style="color:var(--color-text-muted);margin-bottom:2rem">Cette page n'existe pas.</p>
      <a routerLink="/" class="btn btn--ghost">← Accueil</a>
    </div>
  `,
})
export class NotFound {}
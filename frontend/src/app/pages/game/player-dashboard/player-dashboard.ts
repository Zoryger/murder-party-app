import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-player-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div style="max-width:480px;margin:5rem auto;text-align:center">
      <p style="font-size:3rem;margin-bottom:1rem">🕵️</p>
      <h1 style="margin-bottom:.75rem">Tableau de bord joueur</h1>
      <p style="color:var(--color-text-muted);margin-bottom:2rem">Disponible en Phase 5.</p>
      <a routerLink="/" class="btn btn--ghost">← Accueil</a>
    </div>
  `,
})
export class PlayerDashboard {}
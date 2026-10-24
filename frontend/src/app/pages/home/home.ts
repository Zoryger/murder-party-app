import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameService, Game } from '../../core/services/game.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private gameService = inject(GameService);
  auth = inject(AuthService);

  games: Game[] = [];
  isLoading = true;
  isSlow = false; // l'hébergement gratuit met jusqu'à une minute à se réveiller
  errorMsg = '';

  statusLabel: Record<string, string> = {
    waiting: 'En attente',
    active: 'En cours',
    voting: 'Vote final',
    finished: 'Terminée',
  };

  ngOnInit(): void {
    setTimeout(() => {
      if (this.isLoading) this.isSlow = true;
    }, 4000);

    this.gameService.getGames().subscribe({
      next: (res) => {
        this.games = res.data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMsg = 'Impossible de charger les parties. Réessaie dans un instant.';
        this.isLoading = false;
      },
    });
  }
}

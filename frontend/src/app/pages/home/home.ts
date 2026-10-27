import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameService, Game } from '../../core/services/game.service';
import { AuthService } from '../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError, timeout } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private gameService = inject(GameService);
  private changeDetector = inject(ChangeDetectorRef);
  auth = inject(AuthService);

  games: Game[] = [];
  isLoading = true;
  isSlow = false; // l'hébergement gratuit met jusqu'à une minute à se réveiller
  errorMsg = '';
  actionError = '';
  private deletingGameId = signal<number | null>(null);

  statusLabel: Record<string, string> = {
    waiting: 'En attente',
    active: 'En cours',
    voting: 'Vote final',
    finished: 'Terminée',
  };

  ngOnInit(): void {
    setTimeout(() => {
      if (this.isLoading) {
        this.isSlow = true;
        this.changeDetector.markForCheck();
      }
    }, 4000);

    this.gameService.getGames().subscribe({
      next: (res) => {
        this.games = res.data;
        this.isLoading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMsg = 'Impossible de charger les parties. Réessaie dans un instant.';
        this.isLoading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  canDelete(game: Game): boolean {
    return this.auth.currentUser()?.id === game.createdBy;
  }

  isDeleting(gameId: number): boolean {
    return this.deletingGameId() === gameId;
  }

  deleteGame(game: Game): void {
    if (
      this.deletingGameId() !== null ||
      !window.confirm(
        `Supprimer définitivement la partie « ${game.name} » ? Tous les joueurs et les données associées seront effacés. Cette action est irréversible.`,
      )
    ) {
      return;
    }

    this.deletingGameId.set(game.id);
    this.actionError = '';
    this.gameService
      .deleteGame(game.id)
      .pipe(
        timeout({ first: 30_000 }),
        finalize(() => {
          this.deletingGameId.set(null);
          this.changeDetector.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.games = this.games.filter((current) => current.id !== game.id);
          this.changeDetector.markForCheck();
        },
        error: (err: unknown) => {
          this.actionError =
            err instanceof TimeoutError
              ? `Le serveur ne répond pas. La partie « ${game.name} » n’a pas pu être supprimée.`
              : err instanceof HttpErrorResponse
                ? err.error?.message ?? 'Impossible de supprimer cette partie.'
                : 'Impossible de supprimer cette partie.';
          this.changeDetector.markForCheck();
        },
      });
  }
}

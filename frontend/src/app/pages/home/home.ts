import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { catchError, finalize, timeout } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { ApiResponse, Game, GameService } from '../../core/services/game.service';

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
  errorMsg = '';

  statusLabel: Record<string, string> = {
    waiting: 'En attente',
    active: 'En cours',
    finished: 'Terminée',
  };

  ngOnInit(): void {
    this.gameService.getGames()
      .pipe(
        timeout(10000),
        catchError(() => {
          this.errorMsg = 'Impossible de charger les parties.';
          return of({ success: false, data: [] } as ApiResponse<Game[]>);
        }),
        finalize(() => {
          this.isLoading = false;
          this.changeDetector.markForCheck();
        }),
      )
      .subscribe((res) => {
        this.games = Array.isArray(res.data) ? res.data : [];
        this.errorMsg = '';
      });
  }
}
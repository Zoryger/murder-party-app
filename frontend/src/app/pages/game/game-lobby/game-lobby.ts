import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { timeout } from 'rxjs/operators';
import { GameService, Game, PublicPlayer } from '../../../core/services/game.service';
import { AuthService } from '../../../core/services/auth.service';
import { SocketService } from '../../../core/services/socket.service';

@Component({
  selector: 'app-game-lobby',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './game-lobby.html',
  styleUrl: './game-lobby.scss',
})
export class GameLobby implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private gameService = inject(GameService);
  private changeDetector = inject(ChangeDetectorRef);
  auth = inject(AuthService);
  private socketService = inject(SocketService);

  gameId!: number;
  game: Game | null = null;
  players: PublicPlayer[] = [];
  isGm = false;
  isLoading = true;
  errorMsg = '';
  actionMsg = '';
  isAssigning = false;
  isStarting = false;

  ngOnInit(): void {
    this.gameId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
    this.setupSocket();
  }

  ngOnDestroy(): void {
    this.socketService.leaveLobby(this.gameId);
    this.socketService.off('lobby:update');
    this.socketService.off('lobby:assigned');
    this.socketService.off('game:started');
  }

  private setupSocket(): void {
    this.socketService.joinLobby(this.gameId);
    this.socketService.on('lobby:update', () => this.loadPlayers());
    this.socketService.on('lobby:assigned', () => this.loadPlayers());
    this.socketService.on('game:started', () =>
      this.router.navigate(['/game', this.gameId, 'play']),
    );
  }

  private load(): void {
    this.gameService
      .getGame(this.gameId)
      .pipe(timeout(10000))
      .subscribe({
        next: (res) => {
          this.game = res.data;
          this.isGm = this.game.createdBy === this.auth.currentUser()?.id;
          this.changeDetector.markForCheck();

          if (this.game.status === 'active') {
            this.router.navigate(['/game', this.gameId, 'play']);
            return;
          }

          if (!this.isGm) {
            this.gameService
              .joinGame(this.gameId)
              .pipe(timeout(10000))
              .subscribe({
                next: () => this.loadPlayers(),
                error: (err) => {
                  this.errorMsg = err.error?.message ?? 'Impossible de rejoindre cette partie.';
                  this.isLoading = false;
                  this.changeDetector.markForCheck();
                },
              });
          } else {
            this.loadPlayers();
          }
        },
        error: () => {
          this.errorMsg = 'Partie introuvable.';
          this.isLoading = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  private loadPlayers(): void {
    this.gameService
      .getPlayers(this.gameId)
      .pipe(timeout(10000))
      .subscribe({
        next: (res) => {
          this.players = res.data;
          this.isLoading = false;
          this.changeDetector.markForCheck();
        },
        error: () => {
          this.errorMsg = 'Impossible de charger les joueurs.';
          this.isLoading = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  assignCharacters(): void {
    this.isAssigning = true;
    this.actionMsg = '';
    this.gameService.assignCharacters(this.gameId).subscribe({
      next: () => {
        this.isAssigning = false;
        this.changeDetector.markForCheck();
      },
      error: (err) => {
        this.actionMsg = err.error?.message ?? "Erreur lors de l'assignation.";
        this.isAssigning = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  startGame(): void {
    this.isStarting = true;
    this.actionMsg = '';
    this.gameService.startGame(this.gameId).subscribe({
      next: () => {
        /* la redirection est déclenchée par l'événement socket game:started */
        this.changeDetector.markForCheck();
      },
      error: (err) => {
        this.actionMsg = err.error?.message ?? 'Erreur lors du démarrage.';
        this.isStarting = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  get allAssigned(): boolean {
    return this.players.length > 0 && this.players.every((p) => p.isAssigned);
  }
}

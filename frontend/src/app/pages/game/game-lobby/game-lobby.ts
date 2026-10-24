import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  auth = inject(AuthService);
  private socketService = inject(SocketService);

  gameId!: number;
  game: Game | null = null;
  players: PublicPlayer[] = [];
  private gm = signal(false);
  private loading = signal(true);
  errorMsg = '';
  actionMsg = '';
  private assigning = signal(false);
  private starting = signal(false);

  get isGm(): boolean {
    return this.gm();
  }

  get isLoading(): boolean {
    return this.loading();
  }

  get isAssigning(): boolean {
    return this.assigning();
  }

  get isStarting(): boolean {
    return this.starting();
  }

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

  // Le MJ va sur sa console, les joueurs sur leur fiche personnage
  private goToGame(): void {
    this.router.navigate(['/game', this.gameId, this.gm() ? 'gm' : 'play']);
  }

  private setupSocket(): void {
    this.socketService.joinLobby(this.gameId);
    this.socketService.on('lobby:update', () => this.loadPlayers());
    this.socketService.on('lobby:assigned', () => this.loadPlayers());
    this.socketService.on('game:started', () => this.goToGame());
  }

  private load(): void {
    this.gameService.getGame(this.gameId).subscribe({
      next: (res) => {
        this.game = res.data;
        this.gm.set(this.game.createdBy === this.auth.currentUser()?.id);

        if (this.game.status === 'active') {
          this.goToGame();
          return;
        }

        if (!this.gm()) {
          this.gameService.joinGame(this.gameId).subscribe({
            complete: () => this.loadPlayers(),
            error: (err) => {
              this.errorMsg = err.error?.message ?? 'Impossible de rejoindre cette partie.';
              this.loading.set(false);
            },
          });
        } else {
          this.loadPlayers();
        }
      },
      error: () => {
        this.errorMsg = 'Partie introuvable.';
        this.loading.set(false);
      },
    });
  }

  private loadPlayers(): void {
    this.gameService.getPlayers(this.gameId).subscribe({
      next: (res) => {
        this.players = res.data;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  assignCharacters(): void {
    this.assigning.set(true);
    this.actionMsg = '';
    this.gameService.assignCharacters(this.gameId).subscribe({
      next: () => {
        this.assigning.set(false);
      },
      error: (err) => {
        this.actionMsg = err.error?.message ?? "Erreur lors de l'assignation.";
        this.assigning.set(false);
      },
    });
  }

  startGame(): void {
    this.starting.set(true);
    this.actionMsg = '';
    this.gameService.startGame(this.gameId).subscribe({
      next: () => {
        /* la redirection est déclenchée par l'événement socket game:started */
      },
      error: (err) => {
        this.actionMsg = err.error?.message ?? 'Erreur lors du démarrage.';
        this.starting.set(false);
      },
    });
  }

  get allAssigned(): boolean {
    return this.players.length > 0 && this.players.every((p) => p.isAssigned);
  }
}

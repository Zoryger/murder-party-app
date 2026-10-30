import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { GameService, PublicPlayer } from '../../../core/services/game.service';
import { SocketService } from '../../../core/services/socket.service';

@Component({
  selector: 'app-player-status-bar',
  standalone: true,
  templateUrl: './player-status-bar.html',
  styleUrl: './player-status-bar.scss',
})
export class PlayerStatusBar implements OnInit, OnDestroy {
  private router = inject(Router);
  private gameService = inject(GameService);
  private socketService = inject(SocketService);

  gameId: number | null = null;
  myPlayerId: number | null = null;
  myStatus: 'alive' | 'ghost' | null = null;
  players: PublicPlayer[] = [];
  isExpanded = false;
  loadError = '';
  private statusHandler = (): void => this.loadPlayers();
  private navigationSubscription?: Subscription;

  get isVisible(): boolean {
    return this.gameId !== null && this.myStatus !== null;
  }

  get ghosts(): PublicPlayer[] {
    return this.players.filter((player) => player.isAssigned && player.status === 'ghost');
  }

  get ghostNames(): string {
    return this.ghosts.map((player) => player.characterName).join(', ');
  }

  get livingPlayers(): PublicPlayer[] {
    return this.players.filter((player) => player.isAssigned && player.status === 'alive');
  }

  ngOnInit(): void {
    this.syncWithRoute();
    this.navigationSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.syncWithRoute());
  }

  ngOnDestroy(): void {
    this.socketService.off('player:status', this.statusHandler);
    if (this.gameId !== null) this.socketService.leaveLobby(this.gameId);
    this.navigationSubscription?.unsubscribe();
  }

  private syncWithRoute(): void {
    const gameRoute = this.router.url.match(/^\/game\/(\d+)(?:\/|$)/);
    const routeGameId = gameRoute ? Number(gameRoute[1]) : null;
    const match = this.router.url.match(
      /^\/game\/(\d+)\/(play|messages|powers|clues|wallet|final)(?:[/?#]|$)/,
    );
    const nextGameId = match ? Number(match[1]) : null;
    if (nextGameId === this.gameId) return;

    this.socketService.off('player:status', this.statusHandler);
    if (this.gameId !== null && routeGameId !== this.gameId) {
      this.socketService.leaveLobby(this.gameId);
    }
    this.gameId = nextGameId;
    this.myPlayerId = null;
    this.myStatus = null;
    this.players = [];
    this.isExpanded = false;
    this.loadError = '';

    if (nextGameId === null) return;

    this.socketService.joinLobby(nextGameId);
    this.socketService.on('player:status', this.statusHandler);
    this.gameService.getMyCharacterSheet(nextGameId).subscribe({
      next: (res) => {
        if (this.gameId !== nextGameId || res.data.isGm || !res.data.player) return;
        this.myPlayerId = res.data.player.id;
        this.myStatus = res.data.player.status;
        this.loadPlayers();
      },
      error: () => {
        if (this.gameId === nextGameId) {
          this.loadError = 'Impossible de charger les statuts des joueurs.';
        }
      },
    });
  }

  private loadPlayers(): void {
    if (this.gameId === null) return;
    const gameId = this.gameId;
    this.gameService.getPlayers(gameId).subscribe({
      next: (res) => {
        if (this.gameId !== gameId) return;
        this.players = res.data;
        this.loadError = '';
        const me = this.players.find((player) => player.id === this.myPlayerId);
        if (me) this.myStatus = me.status;
      },
      error: () => {
        if (this.gameId === gameId) {
          this.loadError = 'Impossible d’actualiser les statuts des joueurs.';
        }
      },
    });
  }

  playerLabel(player: PublicPlayer): string {
    const you = player.id === this.myPlayerId ? ' (vous)' : '';
    return `${player.status === 'ghost' ? '👻' : '🟢'} ${player.characterName}${you}`;
  }
}

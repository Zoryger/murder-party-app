import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  GameService,
  MyCharacterSheet,
  PublicPlayer,
} from '../../../core/services/game.service';
import { SocketService } from '../../../core/services/socket.service';

@Component({
  selector: 'app-player-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './player-dashboard.html',
  styleUrl: './player-dashboard.scss',
})
export class PlayerDashboard implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private gameService = inject(GameService);
  private socketService = inject(SocketService);
  private statusHandler = (): void => {
    this.load();
    this.loadPlayers();
  };

  gameId!: number;
  sheet: MyCharacterSheet | null = null;
  players: PublicPlayer[] = [];
  private loading = signal(true);
  errorMsg = '';
  playersError = '';

  get isLoading(): boolean {
    return this.loading();
  }

  get ghostCount(): number {
    return this.players.filter((player) => player.status === 'ghost').length;
  }

  murderKnowledgeLabel: Record<string, string> = {
    full: "Vous êtes le seul à connaître l'entièreté de l'organisation du meurtre. Lockart vous à payé pour l'élimination mais vous avez utilisé Vance sous sa forme de loup-garou pour le faire à votre place.",
    partial:
      "Vous savez que vous n'avez pas agi seul. Vous avez demandé à Argus Rusard d'éliminer Chourave contre de l'argent.",
    none: "Vous ne savait pas ce qu'il s'est passé le soir du meurtre dans la serre. Il est possible que vous soyez l'auteur de se crime contre votre volonté.",
  };

  ngOnInit(): void {
    this.gameId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
    this.loadPlayers();

    // Mort, réanimation, lien de Cupidon : la fiche se met à jour sans recharger
    this.socketService.joinLobby(this.gameId);
    this.socketService.on('player:status', this.statusHandler);
    this.socketService.on('love:bond', () => this.load());
    this.socketService.on('money:update', () => this.load());
  }

  ngOnDestroy(): void {
    this.socketService.off('player:status', this.statusHandler);
    this.socketService.off('love:bond');
    this.socketService.off('money:update');
  }

  private load(): void {
    this.gameService.getMyCharacterSheet(this.gameId).subscribe({
      next: (res) => {
        // Le MJ n'a pas de fiche personnage : il a sa console
        if (res.data.isGm) {
          this.router.navigate(['/game', this.gameId, 'gm'], { replaceUrl: true });
          return;
        }
        this.sheet = res.data;
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg = err.error?.message ?? 'Erreur de chargement.';
        this.loading.set(false);
      },
    });
  }

  private loadPlayers(): void {
    this.gameService.getPlayers(this.gameId).subscribe({
      next: (res) => {
        this.players = res.data;
        this.playersError = '';
      },
      error: () => {
        this.playersError = 'Impossible de charger la liste des joueurs.';
      },
    });
  }
}

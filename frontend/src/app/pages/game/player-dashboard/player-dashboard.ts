import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GameService, MyCharacterSheet } from '../../../core/services/game.service';
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
  private gameService = inject(GameService);
  private socketService = inject(SocketService);

  gameId!: number;
  sheet: MyCharacterSheet | null = null;
  isLoading = true;
  errorMsg = '';

  murderKnowledgeLabel: Record<string, string> = {
    full: "Vous savez tout de l'organisation du meurtre.",
    partial: "Vous savez que vous n'avez pas agi seul.",
    none: 'Vous pensez avoir agi seul.',
  };

  ngOnInit(): void {
    this.gameId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();

    // Mort, réanimation, lien de Cupidon : la fiche se met à jour sans recharger
    this.socketService.joinLobby(this.gameId);
    this.socketService.on('player:status', () => this.load());
    this.socketService.on('love:bond', () => this.load());
  }

  ngOnDestroy(): void {
    this.socketService.off('player:status');
    this.socketService.off('love:bond');
  }

  private load(): void {
    this.gameService.getMyCharacterSheet(this.gameId).subscribe({
      next: (res) => {
        this.sheet = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMsg = err.error?.message ?? 'Erreur de chargement.';
        this.isLoading = false;
      },
    });
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GameService, MyCharacterSheet } from '../../../core/services/game.service';

@Component({
  selector: 'app-player-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './player-dashboard.html',
  styleUrl: './player-dashboard.scss',
})
export class PlayerDashboard implements OnInit {
  private route        = inject(ActivatedRoute);
  private gameService    = inject(GameService);

  gameId!:   number;
  sheet:     MyCharacterSheet | null = null;
  isLoading = true;
  errorMsg  = '';

  murderKnowledgeLabel: Record<string, string> = {
    full:    "Vous savez tout de l'organisation du meurtre.",
    partial: "Vous savez que vous n'avez pas agi seul.",
    none:    'Vous pensez avoir agi seul.',
  };

  ngOnInit(): void {
    this.gameId = Number(this.route.snapshot.paramMap.get('id'));
    this.gameService.getMyCharacterSheet(this.gameId).subscribe({
      next:  (res) => { this.sheet = res.data; this.isLoading = false; },
      error: (err) => { this.errorMsg = err.error?.message ?? 'Erreur de chargement.'; this.isLoading = false; },
    });
  }
}
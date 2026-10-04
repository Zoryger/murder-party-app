import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PowerService, MyPower } from '../../../core/services/power.service';
import { GameService, PublicPlayer } from '../../../core/services/game.service';

@Component({
  selector: 'app-powers',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './powers.html',
  styleUrl: './powers.scss',
})
export class Powers implements OnInit {
  private route        = inject(ActivatedRoute);
  private powerService = inject(PowerService);
  private gameService   = inject(GameService);

  gameId!:    number;
  myPlayerId: number | null = null;
  power:      MyPower | null = null;
  players:    PublicPlayer[] = [];
  isLoading  = true;
  errorMsg   = '';

  target1: number | null = null;
  target2: number | null = null;
  isActivating = false;

  voyanteResult:  { characterTitle: string; powerName: string; powerCategory: string }[] | null = null;
  relationResult: { player1: string; player2: string; relationType: string } | null = null;
  informaticienResult = '';

  relationLabel: Record<string, string> = {
    positive: '💚 Positive', neutral: '⚪ Neutre', negative: '❤️‍🔥 Négative', aucune: '🚫 Aucune relation',
  };

  ngOnInit(): void {
    this.gameId = Number(this.route.snapshot.paramMap.get('id'));

    this.gameService.getMyCharacterSheet(this.gameId).subscribe({
      next: (res) => { this.myPlayerId = res.data.player?.id ?? null; },
    });

    this.gameService.getPlayers(this.gameId).subscribe({
      next: (res) => this.players = res.data,
    });

    this.powerService.getMyPower(this.gameId).subscribe({
      next:  (res) => { this.power = res.data; this.isLoading = false; },
      error: (err) => { this.errorMsg = err.error?.message ?? 'Erreur.'; this.isLoading = false; },
    });
  }

  get otherPlayers(): PublicPlayer[] {
    return this.players.filter(p => p.id !== this.myPlayerId);
  }

  activateVoyante(): void {
    this.isActivating = true;
    this.powerService.useVoyante(this.gameId).subscribe({
      next:  (res) => { this.voyanteResult = res.data; this.isActivating = false; this.refreshPower(); },
      error: (err) => { this.errorMsg = err.error?.message ?? 'Erreur.'; this.isActivating = false; },
    });
  }

  activateAnalyseur(): void {
    if (!this.target1 || !this.target2) return;
    this.isActivating = true;
    this.powerService.useAnalyseurRelations(this.gameId, this.target1, this.target2).subscribe({
      next:  (res) => { this.relationResult = res.data; this.isActivating = false; this.refreshPower(); },
      error: (err) => { this.errorMsg = err.error?.message ?? 'Erreur.'; this.isActivating = false; },
    });
  }

  activateInformaticien(): void {
    if (!this.target1 || !this.target2) return;
    this.isActivating = true;
    this.powerService.useInformaticien(this.gameId, this.target1, this.target2).subscribe({
      next:  (res) => { this.informaticienResult = res.message ?? ''; this.isActivating = false; this.refreshPower(); },
      error: (err) => { this.errorMsg = err.error?.message ?? 'Erreur.'; this.isActivating = false; },
    });
  }

  private refreshPower(): void {
    this.powerService.getMyPower(this.gameId).subscribe({ next: (res) => this.power = res.data });
  }
}
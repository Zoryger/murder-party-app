import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PowerService, MyPower } from '../../../core/services/power.service';
import { GameService, PublicPlayer } from '../../../core/services/game.service';
import { ClueService, GameClue } from '../../../core/services/clue.service';

@Component({
  selector: 'app-powers',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './powers.html',
  styleUrl: './powers.scss',
})
export class Powers implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private powerService = inject(PowerService);
  private gameService = inject(GameService);
  private clueService = inject(ClueService);

  gameId!: number;
  myPlayerId: number | null = null;
  power: MyPower | null = null;
  players: PublicPlayer[] = [];
  clues: GameClue[] = [];
  isLoading = true;
  errorMsg = '';

  target1: number | null = null;
  target2: number | null = null;
  isActivating = false;

  voyanteResult: { characterTitle: string; powerName: string; powerCategory: string }[] | null =
    null;
  relationResult: { player1: string; player2: string; relationType: string } | null = null;
  informaticienResult = '';

  selectedClueId: number | null = null;
  falsificateurResult = '';

  fakeSenderId: number | null = null;
  fakeContent = '';
  usurpateurResult = '';

  visionExpiresAt: Date | null = null;
  visionSecondsLeft = 0;
  private visionTimer: ReturnType<typeof setInterval> | null = null;

  relationLabel: Record<string, string> = {
    positive: '💚 Positive',
    neutral: '⚪ Neutre',
    negative: '❤️‍🔥 Négative',
    aucune: '🚫 Aucune relation',
  };

  ngOnInit(): void {
    this.gameId = Number(this.route.snapshot.paramMap.get('id'));

    this.gameService.getMyCharacterSheet(this.gameId).subscribe({
      next: (res) => {
        this.myPlayerId = res.data.player?.id ?? null;
      },
    });

    this.gameService.getPlayers(this.gameId).subscribe({
      next: (res) => (this.players = res.data),
    });

    this.clueService.getClueBoard(this.gameId).subscribe({
      next: (res) => (this.clues = res.data),
      error: () => {},
    });

    this.powerService.getMyPower(this.gameId).subscribe({
      next: (res) => {
        this.power = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMsg = err.error?.message ?? 'Erreur.';
        this.isLoading = false;
      },
    });
  }

  ngOnDestroy(): void {
    if (this.visionTimer) clearInterval(this.visionTimer);
  }

  get otherPlayers(): PublicPlayer[] {
    return this.players.filter((p) => p.id !== this.myPlayerId);
  }

  nameOf(playerId: number | null): string {
    return this.players.find((p) => p.id === playerId)?.characterName ?? '???';
  }

  activateVoyante(): void {
    this.isActivating = true;
    this.powerService.useVoyante(this.gameId).subscribe({
      next: (res) => {
        this.voyanteResult = res.data;
        this.isActivating = false;
        this.refreshPower();
      },
      error: (err) => {
        this.errorMsg = err.error?.message ?? 'Erreur.';
        this.isActivating = false;
      },
    });
  }

  activateAnalyseur(): void {
    if (!this.target1 || !this.target2) return;
    this.isActivating = true;
    this.powerService.useAnalyseurRelations(this.gameId, this.target1, this.target2).subscribe({
      next: (res) => {
        this.relationResult = res.data;
        this.isActivating = false;
        this.refreshPower();
      },
      error: (err) => {
        this.errorMsg = err.error?.message ?? 'Erreur.';
        this.isActivating = false;
      },
    });
  }

  activateInformaticien(): void {
    if (!this.target1 || !this.target2) return;
    this.isActivating = true;
    this.powerService.useInformaticien(this.gameId, this.target1, this.target2).subscribe({
      next: (res) => {
        this.informaticienResult = res.message ?? '';
        this.isActivating = false;
        this.refreshPower();
      },
      error: (err) => {
        this.errorMsg = err.error?.message ?? 'Erreur.';
        this.isActivating = false;
      },
    });
  }

  activateFalsificateur(): void {
    if (!this.selectedClueId || !this.target1) return;
    this.isActivating = true;
    this.powerService.useFalsificateur(this.gameId, this.selectedClueId, this.target1).subscribe({
      next: (res) => {
        this.falsificateurResult = res.message ?? '';
        this.isActivating = false;
        this.refreshPower();
        this.clueService
          .getClueBoard(this.gameId)
          .subscribe({ next: (r) => (this.clues = r.data) });
      },
      error: (err) => {
        this.errorMsg = err.error?.message ?? 'Erreur.';
        this.isActivating = false;
      },
    });
  }

  activateUsurpateur(): void {
    if (!this.target1 || !this.target2 || !this.fakeSenderId || !this.fakeContent.trim()) return;
    this.isActivating = true;
    this.powerService
      .useUsurpateur(
        this.gameId,
        this.target1,
        this.target2,
        this.fakeSenderId,
        this.fakeContent.trim(),
      )
      .subscribe({
        next: (res) => {
          this.usurpateurResult = res.message ?? '';
          this.fakeContent = '';
          this.isActivating = false;
          this.refreshPower();
        },
        error: (err) => {
          this.errorMsg = err.error?.message ?? 'Erreur.';
          this.isActivating = false;
        },
      });
  }

  activateVisionAbsolue(): void {
    this.isActivating = true;
    this.powerService.useVisionAbsolue(this.gameId).subscribe({
      next: (res) => {
        this.visionExpiresAt = new Date(res.data.expiresAt);
        this.isActivating = false;
        this.refreshPower();
        this.startVisionCountdown();
      },
      error: (err) => {
        this.errorMsg = err.error?.message ?? 'Erreur.';
        this.isActivating = false;
      },
    });
  }

  private startVisionCountdown(): void {
    if (this.visionTimer) clearInterval(this.visionTimer);
    this.visionTimer = setInterval(() => {
      if (!this.visionExpiresAt) return;
      const diff = Math.max(0, Math.round((this.visionExpiresAt.getTime() - Date.now()) / 1000));
      this.visionSecondsLeft = diff;
      if (diff <= 0 && this.visionTimer) clearInterval(this.visionTimer);
    }, 1000);
  }

  private refreshPower(): void {
    this.powerService.getMyPower(this.gameId).subscribe({ next: (res) => (this.power = res.data) });
  }
}

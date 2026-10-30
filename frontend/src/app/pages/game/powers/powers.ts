import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import {
  PowerService,
  PowerInfo,
  MyPowerOverview,
  ApiResponse,
} from '../../../core/services/power.service';
import { GameService, PublicPlayer } from '../../../core/services/game.service';
import { ClueService, GameClue } from '../../../core/services/clue.service';
import { SocketService } from '../../../core/services/socket.service';

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
  private socketService = inject(SocketService);

  gameId!: number;
  myPlayerId: number | null = null;
  overview: MyPowerOverview | null = null;
  activeTab: 'own' | 'borrowed' = 'own';
  players: PublicPlayer[] = [];
  clues: GameClue[] = [];

  private loading = signal(true);
  loadError = '';
  actionError = '';
  successMsg = '';
  private activating = signal(false);

  get isLoading(): boolean {
    return this.loading();
  }

  get isActivating(): boolean {
    return this.activating();
  }

  // Champs de formulaire (partagés — remis à zéro au changement d'onglet)
  target1: number | null = null;
  target2: number | null = null;
  codeInput = '';
  substituteId: number | null = null;
  selectedClueId: number | null = null;
  fakeSenderId: number | null = null;
  fakeContent = '';

  // Résultats structurés
  voyanteResult: { characterTitle: string; powerName: string; powerCategory: string }[] | null =
    null;
  relationResult: { player1: string; player2: string; relationType: string } | null = null;

  // Vision absolue
  visionExpiresAt: Date | null = null;
  visionSecondsLeft = 0;
  private visionTimer: ReturnType<typeof setInterval> | null = null;
  private statusHandler = (): void => {
    this.loadPlayers();
    this.loadPower(false);
  };

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

    this.loadPlayers();
    this.loadClues();
    this.loadPower(true);

    // Si quelqu'un me tue / me réanimé pendant que je suis sur cette page, tout se met à jour
    this.socketService.joinLobby(this.gameId);
    this.socketService.on('player:status', this.statusHandler);
  }

  ngOnDestroy(): void {
    this.socketService.off('player:status', this.statusHandler);
    if (this.visionTimer) clearInterval(this.visionTimer);
  }

  // ── Données ──────────────────────────────────────────────────────────────
  get power(): PowerInfo | null {
    if (!this.overview) return null;
    return this.activeTab === 'borrowed' && this.overview.borrowed
      ? this.overview.borrowed
      : this.overview.own;
  }

  get otherPlayers(): PublicPlayer[] {
    return this.players.filter((p) => p.id !== this.myPlayerId);
  }

  get livingOthers(): PublicPlayer[] {
    return this.otherPlayers.filter((p) => p.status === 'alive');
  }

  label(p: PublicPlayer): string {
    return (
      (p.status === 'ghost' ? '👻 Fantôme · ' : '🟢 Vivant · ') +
      p.characterName +
      (p.id === this.myPlayerId ? ' (vous)' : '')
    );
  }

  nameOf(playerId: number | null): string {
    const player = this.players.find((p) => p.id === playerId);
    return player ? this.label(player) : '???';
  }

  private loadPlayers(): void {
    this.gameService
      .getPlayers(this.gameId)
      .subscribe({ next: (res) => (this.players = res.data) });
  }

  private loadClues(): void {
    this.clueService
      .getClueBoard(this.gameId)
      .subscribe({ next: (res) => (this.clues = res.data), error: () => {} });
  }

  private loadPower(initial: boolean): void {
    this.powerService.getMyPower(this.gameId).subscribe({
      next: (res) => {
        this.overview = res.data;
        if (!res.data.borrowed) this.activeTab = 'own';
        this.loading.set(false);
      },
      error: (err) => {
        if (initial) this.loadError = err.error?.message ?? 'Erreur de chargement.';
        this.loading.set(false);
      },
    });
  }

  selectTab(tab: 'own' | 'borrowed'): void {
    this.activeTab = tab;
    this.target1 =
      this.target2 =
      this.substituteId =
      this.selectedClueId =
      this.fakeSenderId =
        null;
    this.codeInput = this.fakeContent = '';
    this.actionError = this.successMsg = '';
    this.voyanteResult = null;
    this.relationResult = null;
  }

  // ── Lancement générique d'une action ─────────────────────────────────────
  private run<T>(
    request: Observable<ApiResponse<T>>,
    onSuccess?: (res: ApiResponse<T>) => void,
  ): void {
    this.activating.set(true);
    this.actionError = '';
    this.successMsg = '';

    request.subscribe({
      next: (res) => {
        onSuccess?.(res);
        this.activating.set(false);
        this.loadPower(false);
        this.loadPlayers();
      },
      error: (err) => {
        this.actionError = err.error?.message ?? 'Erreur.';
        this.activating.set(false);
      },
    });
  }

  // ── Pouvoirs ─────────────────────────────────────────────────────────────
  activateVoyante(): void {
    this.run(this.powerService.useVoyante(this.gameId), (res) => {
      this.voyanteResult = res.data;
    });
  }

  activateAnalyseur(): void {
    if (!this.target1 || !this.target2) return;
    this.run(
      this.powerService.useAnalyseurRelations(this.gameId, this.target1, this.target2),
      (res) => {
        this.relationResult = res.data;
      },
    );
  }

  activateInformaticien(): void {
    if (!this.target1 || !this.target2) return;
    this.run(this.powerService.useInformaticien(this.gameId, this.target1, this.target2), (res) => {
      this.successMsg = res.message ?? '';
    });
  }

  activateFalsificateur(): void {
    if (!this.selectedClueId || !this.target1) return;
    this.run(
      this.powerService.useFalsificateur(this.gameId, this.selectedClueId, this.target1),
      (res) => {
        this.successMsg = res.message ?? '';
        this.loadClues();
      },
    );
  }

  activateUsurpateur(): void {
    if (!this.target1 || !this.target2 || !this.fakeSenderId || !this.fakeContent.trim()) return;
    this.run(
      this.powerService.useUsurpateur(
        this.gameId,
        this.target1,
        this.target2,
        this.fakeSenderId,
        this.fakeContent.trim(),
      ),
      (res) => {
        this.successMsg = res.message ?? '';
        this.fakeContent = '';
      },
    );
  }

  activateVisionAbsolue(): void {
    this.run(this.powerService.useVisionAbsolue(this.gameId), (res) => {
      this.visionExpiresAt = new Date(res.data.expiresAt);
      this.startVisionCountdown();
    });
  }

  activateChasseur(): void {
    if (!this.codeInput.trim()) return;
    this.run(this.powerService.useChasseurDePrimes(this.gameId, this.codeInput.trim()), (res) => {
      this.successMsg = res.message ?? '';
      this.codeInput = '';
    });
  }

  activateNecromancien(): void {
    if (!this.codeInput.trim()) return;
    this.run(this.powerService.useNecromancien(this.gameId, this.codeInput.trim()), (res) => {
      this.successMsg = res.message ?? '';
      this.codeInput = '';
    });
  }

  activateHorcruxe(): void {
    if (!this.substituteId) return;
    this.run(this.powerService.useHorcruxe(this.gameId, this.substituteId), (res) => {
      this.successMsg = res.message ?? '';
      this.substituteId = null;
    });
  }

  activateCupidon(): void {
    if (!this.target1 || !this.target2) return;
    this.run(this.powerService.useCupidon(this.gameId, this.target1, this.target2), (res) => {
      this.successMsg = res.message ?? '';
    });
  }

  activateDuelliste(): void {
    if (!this.target1 || !this.target2) return;
    this.run(this.powerService.useDuelliste(this.gameId, this.target1, this.target2), (res) => {
      this.successMsg = res.message ?? '';
    });
  }

  activateInversion(): void {
    if (!this.target1 || !this.target2) return;
    this.run(
      this.powerService.useInversionFrequence(this.gameId, this.target1, this.target2),
      (res) => {
        this.successMsg = res.message ?? '';
      },
    );
  }

  activateBrouilleur(): void {
    this.run(this.powerService.useBrouilleur(this.gameId), (res) => {
      this.successMsg = res.message ?? '';
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
}

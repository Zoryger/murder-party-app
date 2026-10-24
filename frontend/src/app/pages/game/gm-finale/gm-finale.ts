import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FinaleService, FinalStatus } from '../../../core/services/finale.service';
import { SocketService } from '../../../core/services/socket.service';

@Component({
  selector: 'app-gm-finale',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './gm-finale.html',
  styleUrl: './gm-finale.scss',
})
export class GmFinale implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private finale = inject(FinaleService);
  private socketService = inject(SocketService);

  gameId!: number;
  info: FinalStatus | null = null;

  isLoading = signal(true);
  errorMsg = '';
  actionError = '';
  actionMsg = '';
  isBusy = false;

  ngOnInit(): void {
    this.gameId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();

    // Chaque réponse rendue fait avancer la barre de progression
    this.socketService.joinLobby(this.gameId);
    this.socketService.on('final:update', () => this.load());
    this.socketService.on('game:phase', () => this.load());
  }

  ngOnDestroy(): void {
    this.socketService.off('final:update');
    this.socketService.off('game:phase');
  }

  get pending(): string[] {
    return (this.info?.players ?? []).filter((p) => !p.submitted).map((p) => p.characterName);
  }

  get progress(): number {
    return this.info && this.info.totalPlayers > 0
      ? (this.info.submittedCount / this.info.totalPlayers) * 100
      : 0;
  }

  // Temps écoulé depuis le lancement de la partie
  get elapsed(): string {
    if (!this.info?.startedAt) return '';
    const minutes = Math.max(
      0,
      Math.round((Date.now() - new Date(this.info.startedAt).getTime()) / 60000),
    );
    return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
  }

  private load(): void {
    this.finale.getFinalStatus(this.gameId).subscribe({
      next: (res) => {
        this.info = res.data;
        this.isLoading.set(false);
      },
      error: (err) => {
        if (!this.info) this.errorMsg = err.error?.message ?? 'Erreur de chargement.';
        this.isLoading.set(false);
      },
    });
  }

  close(): void {
    if (
      !confirm(
        "Clôturer la partie ?\n\nPouvoirs, messagerie et dons s'arrêtent, les duels en cours sont annulés et les joueurs passent au formulaire final.",
      )
    )
      return;
    this.run(this.finale.closeGame(this.gameId));
  }

  reopen(): void {
    if (
      !confirm(
        'Reprendre la partie ?\n\nLes joueurs reviennent au jeu. Les réponses déjà rendues sont conservées.',
      )
    )
      return;
    this.run(this.finale.reopenGame(this.gameId));
  }

  reveal(): void {
    const missing = this.pending.length;
    const warning =
      missing > 0
        ? `\n\n⚠️ ${missing} joueur(s) n'ont pas encore rendu leur réponse : ${this.pending.join(', ')}.`
        : '';
    if (!confirm(`Révéler la solution ?${warning}\n\nLe vote est définitif.`)) return;
    this.run(this.finale.revealGame(this.gameId));
  }

  private run(request: ReturnType<FinaleService['closeGame']>): void {
    this.isBusy = true;
    this.actionError = '';
    this.actionMsg = '';

    request.subscribe({
      next: (res) => {
        this.actionMsg = res.message ?? '';
        this.isBusy = false;
        this.load();
      },
      error: (err) => {
        this.actionError = err.error?.message ?? 'Erreur.';
        this.isBusy = false;
      },
    });
  }
}

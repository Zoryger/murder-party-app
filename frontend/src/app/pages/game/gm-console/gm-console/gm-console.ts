import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import * as QRCode from 'qrcode';
import { GmService, GmOverview, GmAlchemistRequest } from '../../../../core/services/gm.service';
import { GameService } from '../../../../core/services/game.service';
import { SocketService } from '../../../../core/services/socket.service';
import { TimeoutError, timeout } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-gm-console',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './gm-console.html',
  styleUrl: './gm-console.scss',
})
export class GmConsole implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private gm = inject(GmService);
  private gameService = inject(GameService);
  private socketService = inject(SocketService);

  gameId!: number;
  tab: 'players' | 'alchemist' | 'qr' = 'players';

  overview: GmOverview | null = null;
  requests: GmAlchemistRequest[] = [];
  qrImages: Record<string, string> = {}; // slug → image (data URL)

  private loading = signal(true);
  errorMsg = '';
  actionError = '';
  busyId: number | null = null;
  private deleting = signal(false);

  get isLoading(): boolean {
    return this.loading();
  }

  get isDeleting(): boolean {
    return this.deleting();
  }

  ngOnInit(): void {
    this.gameId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadAll();

    // Nouvelle question de l'Alchimiste, argent, mort / réanimation : la console se met à jour seule
    this.socketService.joinLobby(this.gameId);
    this.socketService.on('alchemist:update', () => this.loadAll());
    this.socketService.on('money:update', () => this.loadOverview());
    this.socketService.on('player:status', () => this.loadOverview());
  }

  ngOnDestroy(): void {
    this.socketService.off('alchemist:update');
    this.socketService.off('money:update');
    this.socketService.off('player:status');
  }

  get pending(): GmAlchemistRequest[] {
    return this.requests.filter((r) => r.status === 'pending');
  }
  get history(): GmAlchemistRequest[] {
    return this.requests.filter((r) => r.status !== 'pending');
  }

  qrUrl(slug: string): string {
    return `${window.location.origin}/qr/${slug}`;
  }

  private loadAll(): void {
    this.loadOverview();
    this.loadRequests();
  }

  private loadOverview(): void {
    this.gm.getOverview(this.gameId).subscribe({
      next: (res) => {
        this.overview = res.data;
        this.loading.set(false);
        void this.buildQrCodes(res.data.qrClues);
      },
      error: (err) => {
        if (!this.overview) this.errorMsg = err.error?.message ?? 'Erreur de chargement.';
        this.loading.set(false);
      },
    });
  }

  private loadRequests(): void {
    this.gm.getAlchemistRequests(this.gameId).subscribe({
      next: (res) => (this.requests = res.data),
      error: () => {},
    });
  }

  // Génère l'image de chaque QR code (une seule fois par code)
  private async buildQrCodes(clues: { slug: string }[]): Promise<void> {
    for (const c of clues) {
      if (this.qrImages[c.slug]) continue;
      this.qrImages[c.slug] = await QRCode.toDataURL(this.qrUrl(c.slug), { width: 240, margin: 1 });
    }
  }

  answer(requestId: number, answer: 'yes' | 'no' | 'refuse'): void {
    this.busyId = requestId;
    this.actionError = '';

    this.gm.answerAlchemist(this.gameId, requestId, answer).subscribe({
      next: () => {
        this.busyId = null;
        this.loadAll();
      },
      error: (err) => {
        this.actionError = err.error?.message ?? 'Erreur.';
        this.busyId = null;
        this.loadAll();
      },
    });
  }

  print(): void {
    window.print();
  }

  deleteGame(): void {
    if (
      this.deleting() ||
      !window.confirm(
        'Supprimer définitivement cette partie en cours ? Tous les joueurs et toutes les données liées seront effacés. Cette action est irréversible.',
      )
    ) {
      return;
    }

    this.deleting.set(true);
    this.actionError = '';
    this.gameService
      .deleteGame(this.gameId)
      .pipe(
        timeout({ first: 30_000 }),
        finalize(() => this.deleting.set(false)),
      )
      .subscribe({
        next: () => {
          void this.router.navigate(['/']);
        },
        error: (err: unknown) => {
          this.actionError =
            err instanceof TimeoutError
              ? 'Le serveur ne répond pas. La partie n’a pas pu être supprimée.'
              : err instanceof HttpErrorResponse
                ? err.error?.message ?? 'Impossible de supprimer cette partie.'
                : 'Impossible de supprimer cette partie.';
        },
      });
  }
}

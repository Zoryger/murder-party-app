import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { EventService, GameEventsState, DuelState } from '../../../core/services/event.service';
import { SocketService } from '../../../core/services/socket.service';
import { AuthService } from '../../../core/services/auth.service';

const GAME_URL = /^\/game\/(\d+)\/(lobby|play|powers|messages|clues)/;
const BLOCKED_PAGES = ['powers', 'messages', 'clues']; // pages recouvertes par l'écran de panne

@Component({
  selector: 'app-game-events',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './game-events.html',
  styleUrl: './game-events.scss',
})
export class GameEvents implements OnInit, OnDestroy {
  private router = inject(Router);
  private eventService = inject(EventService);
  private socketService = inject(SocketService);
  private auth = inject(AuthService);

  gameId: number | null = null;
  page: string | null = null;
  state: GameEventsState | null = null;

  now = Date.now();
  isBusy = false;
  actionError = '';
  dismissedDuelId: number | null = null;

  private clockOffset = 0; // écart entre l'horloge du serveur et celle du navigateur
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private navSub: Subscription | null = null;

  ngOnInit(): void {
    this.handleUrl(this.router.url);

    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.handleUrl(e.urlAfterRedirects));

    // Fait vivre les comptes à rebours
    this.tickTimer = setInterval(() => {
      this.now = Date.now() + this.clockOffset;
    }, 1000);
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
    if (this.tickTimer) clearInterval(this.tickTimer);
    this.clearRefreshTimer();
    this.socketService.off('event:update');
  }

  // ── Suivi de la page courante ───────────────────────────────────────────
  private handleUrl(url: string): void {
    const match = GAME_URL.exec(url);
    if (!match || !this.auth.isLoggedIn()) {
      this.reset();
      return;
    }

    const gameId = Number(match[1]);
    this.page = match[2] ?? null;

    if (gameId !== this.gameId) {
      this.gameId = gameId;
      this.state = null;
      this.actionError = '';
      this.socketService.off('event:update');
      this.socketService.on('event:update', () => this.refresh());
    }

    // (Re)joint la room à chaque navigation : une page qui quitte la room ne doit pas nous en priver
    this.socketService.joinLobby(gameId);
    this.refresh();
  }

  private reset(): void {
    this.gameId = null;
    this.page = null;
    this.state = null;
    this.actionError = '';
    this.clearRefreshTimer();
    this.socketService.off('event:update');
  }

  // ── Récupération de l'état ───────────────────────────────────────────────
  refresh(): void {
    const gameId = this.gameId;
    if (!gameId) return;

    this.eventService.getEvents(gameId).subscribe({
      next: (res) => {
        if (gameId !== this.gameId) return; // l'utilisateur a changé de partie entre-temps
        this.state = res.data;
        this.clockOffset = new Date(res.data.serverNow).getTime() - Date.now();
        this.now = Date.now() + this.clockOffset;
        this.scheduleNextRefresh(res.data);
      },
      error: () => {
        if (gameId === this.gameId) this.state = null;
      },
    });
  }

  // Se re-synchronise juste après la prochaine échéance (fin de panne, de joute, de vote…)
  private scheduleNextRefresh(s: GameEventsState): void {
    this.clearRefreshTimer();

    const ends: number[] = [];
    if (s.blackout) ends.push(Date.parse(s.blackout.endsAt));
    if (s.inversion) ends.push(Date.parse(s.inversion.endsAt));
    if (s.duel?.status === 'joust') ends.push(Date.parse(s.duel.joustEndsAt));
    if (s.duel?.status === 'voting') ends.push(Date.parse(s.duel.votingEndsAt));

    const upcoming = ends.map((t) => t - (Date.now() + this.clockOffset)).filter((ms) => ms > 0);
    if (upcoming.length === 0) return;

    this.refreshTimer = setTimeout(() => this.refresh(), Math.min(...upcoming) + 500);
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // ── Affichage ─────────────────────────────────────────────────────────────
  get showOverlay(): boolean {
    return (
      !!this.state?.blackout && !this.state.isGm && !!this.page && BLOCKED_PAGES.includes(this.page)
    );
  }

  secondsLeft(iso: string): number {
    return Math.max(0, Math.ceil((Date.parse(iso) - this.now) / 1000));
  }

  clock(iso: string): string {
    const s = this.secondsLeft(iso);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  isDuelVisible(d: DuelState): boolean {
    return !(d.result && this.dismissedDuelId === d.id);
  }

  dismissResult(duel: DuelState): void {
    this.dismissedDuelId = duel.id;
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  vote(votedForId: number): void {
    const duel = this.state?.duel;
    if (!duel || !this.gameId || this.isBusy) return;

    this.isBusy = true;
    this.actionError = '';

    this.eventService.voteDuel(this.gameId, duel.id, votedForId).subscribe({
      next: () => {
        this.isBusy = false;
        this.refresh();
      },
      error: (err) => {
        this.actionError = err.error?.message ?? 'Erreur.';
        this.isBusy = false;
        this.refresh();
      },
    });
  }

  cancelBlackout(): void {
    if (!this.gameId || this.isBusy) return;
    this.isBusy = true;

    this.eventService.cancelBlackout(this.gameId).subscribe({
      next: () => {
        this.isBusy = false;
        this.refresh();
      },
      error: (err) => {
        this.actionError = err.error?.message ?? 'Erreur.';
        this.isBusy = false;
      },
    });
  }
}

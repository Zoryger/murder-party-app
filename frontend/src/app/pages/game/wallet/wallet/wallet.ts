import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GameService, PublicPlayer } from '../../../../core/services/game.service';
import {
  EconomyService,
  WalletInfo,
  AlchemistRequestView,
} from '../../../../core/services/economy.service';
import { SocketService } from '../../../../core/services/socket.service';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './wallet.html',
  styleUrl: './wallet.scss',
})
export class Wallet implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private gameService = inject(GameService);
  private economy = inject(EconomyService);
  private socketService = inject(SocketService);

  gameId!: number;
  wallet: WalletInfo | null = null;
  players: PublicPlayer[] = [];
  requests: AlchemistRequestView[] = [];

  isLoading = signal(true);
  loadError = '';

  // Don
  giveTo: number | null = null;
  giveAmount: number | null = null;
  giveMsg = '';
  giveError = '';
  isGiving = false;

  // Alchimiste
  question = '';
  askMsg = '';
  askError = '';
  isAsking = false;

  ngOnInit(): void {
    this.gameId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadAll();

    // Don reçu, réponse du MJ, mort ou réanimation : tout se met à jour sans recharger
    this.socketService.joinLobby(this.gameId);
    this.socketService.on('money:update', () => this.loadAll());
    this.socketService.on('alchemist:update', () => this.loadAll());
    this.socketService.on('player:status', () => this.loadAll());
  }

  ngOnDestroy(): void {
    this.socketService.off('money:update');
    this.socketService.off('alchemist:update');
    this.socketService.off('player:status');
  }

  get livingOthers(): PublicPlayer[] {
    return this.players.filter((p) => p.status === 'alive' && p.id !== this.wallet?.playerId);
  }

  private loadAll(): void {
    this.economy.getWallet(this.gameId).subscribe({
      next: (res) => {
        this.wallet = res.data;
        this.isLoading.set(false);
      },
      error: (err) => {
        if (!this.wallet) this.loadError = err.error?.message ?? 'Erreur de chargement.';
        this.isLoading.set(false);
      },
    });

    this.gameService
      .getPlayers(this.gameId)
      .subscribe({ next: (res) => (this.players = res.data) });

    this.economy.getMyAlchemistRequests(this.gameId).subscribe({
      next: (res) => (this.requests = res.data),
      error: () => {},
    });
  }

  give(): void {
    if (!this.giveTo || !this.giveAmount) return;

    this.isGiving = true;
    this.giveMsg = '';
    this.giveError = '';

    this.economy.transferMoney(this.gameId, this.giveTo, this.giveAmount).subscribe({
      next: (res) => {
        this.giveMsg = res.message ?? '';
        this.giveAmount = null;
        this.isGiving = false;
        this.loadAll();
      },
      error: (err) => {
        this.giveError = err.error?.message ?? 'Erreur.';
        this.isGiving = false;
      },
    });
  }

  ask(): void {
    const text = this.question.trim();
    if (text.length < 5) return;

    this.isAsking = true;
    this.askMsg = '';
    this.askError = '';

    this.economy.askAlchemist(this.gameId, text).subscribe({
      next: (res) => {
        this.askMsg = res.message ?? '';
        this.question = '';
        this.isAsking = false;
        this.loadAll();
      },
      error: (err) => {
        this.askError = err.error?.message ?? 'Erreur.';
        this.isAsking = false;
      },
    });
  }
}

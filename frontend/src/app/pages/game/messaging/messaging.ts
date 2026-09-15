import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GameService, PublicPlayer } from '../../../core/services/game.service';
import { ConversationService, ConversationSummary, ConversationMessage } from '../../../core/services/conversation.service';
import { SocketService } from '../../../core/services/socket.service';

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './messaging.html',
  styleUrl: './messaging.scss',
})
export class Messaging implements OnInit, OnDestroy {
  private route          = inject(ActivatedRoute);
  private gameService     = inject(GameService);
  private convService     = inject(ConversationService);
  private socketService   = inject(SocketService);

  gameId!:      number;
  myPlayerId:   number | null = null;
  players:      PublicPlayer[] = [];
  conversations: ConversationSummary[] = [];

  selectedConversationId: number | null = null;
  participants: { id: number; characterName: string }[] = [];
  messages:     ConversationMessage[] = [];
  isParticipant = false;

  newMessage   = '';
  codeInput    = '';
  codeMsg      = '';
  codeError    = false;
  isLoading    = true;
  isSending    = false;
  showNewConvo = false;

  ngOnInit(): void {
    this.gameId = Number(this.route.snapshot.paramMap.get('id'));

    this.gameService.getMyCharacterSheet(this.gameId).subscribe({
      next: (res) => { this.myPlayerId = res.data.player?.id ?? null; },
    });

    this.gameService.getPlayers(this.gameId).subscribe({
      next: (res) => this.players = res.data,
    });

    this.loadConversations();

    this.socketService.joinLobby(this.gameId);
    this.socketService.on('message:new',    () => this.onRealtimeUpdate());
    this.socketService.on('code:unlocked',  () => this.onRealtimeUpdate());
  }

  ngOnDestroy(): void {
    this.socketService.off('message:new');
    this.socketService.off('code:unlocked');
  }

  private onRealtimeUpdate(): void {
    this.loadConversations();
    if (this.selectedConversationId) this.loadMessages(this.selectedConversationId);
  }

  loadConversations(): void {
    this.convService.getConversations(this.gameId).subscribe({
      next:  (res) => { this.conversations = res.data; this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });
  }

  openConversation(id: number): void {
    this.selectedConversationId = id;
    this.showNewConvo = false;
    this.loadMessages(id);
  }

  private loadMessages(id: number): void {
    this.convService.getMessages(this.gameId, id).subscribe({
      next: (res) => {
        this.participants  = res.data.participants;
        this.messages       = res.data.messages;
        this.isParticipant  = res.data.isParticipant;
      },
    });
  }

  startConversation(withPlayerId: number): void {
    this.convService.startConversation(this.gameId, withPlayerId).subscribe({
      next: (res) => {
        this.loadConversations();
        this.openConversation(res.data.id);
      },
    });
  }

  send(): void {
    if (!this.newMessage.trim() || !this.selectedConversationId) return;
    this.isSending = true;
    this.convService.sendMessage(this.gameId, this.selectedConversationId, this.newMessage.trim()).subscribe({
      next: () => {
        this.newMessage = '';
        this.isSending  = false;
        this.loadMessages(this.selectedConversationId!);
      },
      error: () => { this.isSending = false; },
    });
  }

  redeemCode(): void {
    if (!this.codeInput.trim()) return;
    this.convService.redeemCode(this.gameId, this.codeInput.trim()).subscribe({
      next: (res) => {
        this.codeMsg   = res.message ?? '';
        this.codeError = false;
        this.codeInput = '';
        this.loadConversations();
      },
      error: (err) => {
        this.codeMsg   = err.error?.message ?? 'Code invalide.';
        this.codeError = true;
      },
    });
  }

  get contactsWithoutConversation(): PublicPlayer[] {
    const existingIds = new Set(this.conversations.filter(c => c.isOwn).map(c => c.otherPlayerId));
    return this.players.filter(p => p.id !== this.myPlayerId && !existingIds.has(p.id));
  }
}
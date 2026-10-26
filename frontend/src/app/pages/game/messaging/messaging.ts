import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GameService, PublicPlayer } from '../../../core/services/game.service';
import {
  ConversationService,
  ConversationSummary,
  ConversationMessage,
} from '../../../core/services/conversation.service';
import { SocketService } from '../../../core/services/socket.service';

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './messaging.html',
  styleUrl: './messaging.scss',
})
export class Messaging implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private gameService = inject(GameService);
  private convService = inject(ConversationService);
  private socketService = inject(SocketService);
  private changeDetector = inject(ChangeDetectorRef);

  gameId!: number;
  myPlayerId: number | null = null;
  myStatus: 'alive' | 'ghost' = 'alive';
  players: PublicPlayer[] = [];
  conversations: ConversationSummary[] = [];

  selectedConversationId: number | null = null;
  participants: { id: number; characterName: string }[] = [];
  messages: ConversationMessage[] = [];
  isParticipant = false;
  isCreatedByMe = false;
  isFake = false;
  canWrite = false;

  newMessage = '';
  codeInput = '';
  codeMsg = '';
  codeError = false;
  isLoading = true;
  isSending = false;
  showNewConvo = false;
  pageError = '';
  threadError = '';
  private conversationsRequest = 0;
  private messagesRequest = 0;

  get conversationGroups(): {
    category: ConversationSummary['category'];
    label: string;
    conversations: ConversationSummary[];
  }[] {
    const groups: {
      category: ConversationSummary['category'];
      label: string;
      conversations: ConversationSummary[];
    }[] = [
      { category: 'base', label: 'Discussions de base', conversations: [] },
      { category: 'hacked', label: 'Discussions piratées', conversations: [] },
      { category: 'power', label: 'Pouvoirs et manipulations', conversations: [] },
    ];

    return groups
      .map((group) => ({
        ...group,
        conversations: this.conversations.filter(
          (conversation) => conversation.category === group.category,
        ),
      }))
      .filter((group) => group.conversations.length > 0);
  }

  ngOnInit(): void {
    this.gameId = Number(this.route.snapshot.paramMap.get('id'));

    this.loadMyStatus();

    this.gameService.getPlayers(this.gameId).subscribe({
      next: (res) => {
        this.players = res.data;
        this.changeDetector.markForCheck();
      },
    });

    this.loadConversations();

    this.socketService.joinLobby(this.gameId);
    this.socketService.on('message:new', (event) => this.onRealtimeUpdate(event));
    this.socketService.on('conversation:update', (event) => this.onRealtimeUpdate(event));
    this.socketService.on('code:unlocked', () => this.onRealtimeUpdate());
    // Mort ou réanimation pendant que la page est ouverte : le champ de saisie apparaît / disparaît
    this.socketService.on('player:status', () => {
      this.loadMyStatus();
      this.onRealtimeUpdate();
    });
  }

  ngOnDestroy(): void {
    this.socketService.off('message:new');
    this.socketService.off('conversation:update');
    this.socketService.off('code:unlocked');
    this.socketService.off('player:status');
  }

  private loadMyStatus(): void {
    this.gameService.getMyCharacterSheet(this.gameId).subscribe({
      next: (res) => {
        this.myPlayerId = res.data.player?.id ?? null;
        this.myStatus = res.data.player?.status ?? 'alive';
        if (this.myStatus === 'ghost') this.showNewConvo = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  private onRealtimeUpdate(event?: { conversationId?: number }): void {
    this.loadConversations();
    if (
      this.selectedConversationId &&
      (!event?.conversationId || event.conversationId === this.selectedConversationId)
    ) {
      this.loadMessages(this.selectedConversationId);
    }
  }

  loadConversations(): void {
    const request = ++this.conversationsRequest;
    this.convService.getConversations(this.gameId).subscribe({
      next: (res) => {
        if (request !== this.conversationsRequest) return;
        this.conversations = res.data;
        this.isLoading = false;
        this.pageError = '';
        if (
          this.selectedConversationId &&
          !this.conversations.some((conversation) => conversation.id === this.selectedConversationId)
        ) {
          this.selectedConversationId = null;
          this.participants = [];
          this.messages = [];
          this.canWrite = false;
          this.isParticipant = false;
          this.isCreatedByMe = false;
          this.isFake = false;
        }
        this.changeDetector.markForCheck();
      },
      error: (err) => {
        if (request !== this.conversationsRequest) return;
        this.isLoading = false;
        this.pageError = err.error?.message ?? 'Impossible de charger les conversations.';
        this.changeDetector.markForCheck();
      },
    });
  }

  openConversation(id: number): void {
    this.selectedConversationId = id;
    this.showNewConvo = false;
    this.participants = [];
    this.messages = [];
    this.isParticipant = false;
    this.isCreatedByMe = false;
    this.isFake = false;
    this.canWrite = false;
    this.threadError = '';
    this.loadMessages(id);
  }

  private loadMessages(id: number): void {
    const request = ++this.messagesRequest;
    this.convService.getMessages(this.gameId, id).subscribe({
      next: (res) => {
        if (request !== this.messagesRequest || this.selectedConversationId !== id) return;
        this.participants = res.data.participants;
        this.messages = res.data.messages;
        this.isParticipant = res.data.isParticipant;
        this.isCreatedByMe = res.data.isCreatedByMe;
        this.isFake = res.data.isFake;
        this.canWrite = res.data.canWrite;
        this.threadError = '';
        this.changeDetector.markForCheck();
      },
      error: (err) => {
        if (request !== this.messagesRequest || this.selectedConversationId !== id) return;
        this.threadError = err.error?.message ?? 'Impossible de charger cette conversation.';
        this.changeDetector.markForCheck();
      },
    });
  }

  startConversation(withPlayerId: number): void {
    this.convService.startConversation(this.gameId, withPlayerId).subscribe({
      next: (res) => {
        this.loadConversations();
        this.openConversation(res.data.id);
      },
      error: (err) => {
        this.pageError = err.error?.message ?? 'Impossible de créer la conversation.';
        this.changeDetector.markForCheck();
      },
    });
  }

  send(): void {
    if (!this.newMessage.trim() || !this.selectedConversationId || !this.canWrite) return;
    this.isSending = true;
    const conversationId = this.selectedConversationId;
    this.convService
      .sendMessage(this.gameId, conversationId, this.newMessage.trim())
      .subscribe({
        next: () => {
          this.newMessage = '';
          this.isSending = false;
          this.loadMessages(conversationId);
          this.changeDetector.markForCheck();
        },
        error: (err) => {
          this.isSending = false;
          this.threadError = err.error?.message ?? "Impossible d'envoyer le message.";
          this.changeDetector.markForCheck();
        },
      });
  }

  redeemCode(): void {
    if (!this.codeInput.trim()) return;
    this.convService.redeemCode(this.gameId, this.codeInput.trim()).subscribe({
      next: (res) => {
        this.codeMsg = res.message ?? '';
        this.codeError = false;
        this.codeInput = '';
        this.loadConversations();
        this.changeDetector.markForCheck();
      },
      error: (err) => {
        this.codeMsg = err.error?.message ?? 'Code invalide.';
        this.codeError = true;
        this.changeDetector.markForCheck();
      },
    });
  }

  get contactsWithoutConversation(): PublicPlayer[] {
    const existingIds = new Set(
      this.conversations.filter((c) => c.isOwn).map((c) => c.otherPlayerId),
    );
    return this.players.filter((p) => p.id !== this.myPlayerId && !existingIds.has(p.id));
  }
}

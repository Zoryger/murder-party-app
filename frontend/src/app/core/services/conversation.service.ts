import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ConversationSummary {
  id:            number;
  isOwn:         boolean;
  isFake:        boolean;
  otherPlayerId: number | null;
  displayLabel:  string;
  lastMessage:   { content: string; sentAt: string; senderName: string } | null;
}

export interface ConversationMessage {
  id:         number;
  senderId:   number;
  senderName: string;
  content:    string;
  sentAt:     string;
}

export interface ConversationDetail {
  isParticipant: boolean;
  participants:  { id: number; characterName: string }[];
  messages:      ConversationMessage[];
}

export interface ApiResponse<T> {
  success:  boolean;
  data:     T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ConversationService {
  private http = inject(HttpClient);
  private API  = environment.apiUrl;

  getConversations(gameId: number): Observable<ApiResponse<ConversationSummary[]>> {
    return this.http.get<ApiResponse<ConversationSummary[]>>(`${this.API}/games/${gameId}/conversations`);
  }

  startConversation(gameId: number, withPlayerId: number): Observable<ApiResponse<{ id: number }>> {
    return this.http.post<ApiResponse<{ id: number }>>(`${this.API}/games/${gameId}/conversations`, { withPlayerId });
  }

  getMessages(gameId: number, conversationId: number): Observable<ApiResponse<ConversationDetail>> {
    return this.http.get<ApiResponse<ConversationDetail>>(`${this.API}/games/${gameId}/conversations/${conversationId}/messages`);
  }

  sendMessage(gameId: number, conversationId: number, content: string): Observable<ApiResponse<ConversationMessage>> {
    return this.http.post<ApiResponse<ConversationMessage>>(`${this.API}/games/${gameId}/conversations/${conversationId}/messages`, { content });
  }

  redeemCode(gameId: number, code: string): Observable<ApiResponse<{ characterName: string }>> {
    return this.http.post<ApiResponse<{ characterName: string }>>(`${this.API}/games/${gameId}/redeem-code`, { code });
  }
}
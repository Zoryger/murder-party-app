import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DuelState {
  id: number;
  status: 'joust' | 'voting' | 'finished' | 'cancelled';
  challengers: { id: number; characterName: string }[];
  joustEndsAt: string;
  votingEndsAt: string;
  isChallenger: boolean;
  canVote: boolean;
  hasVoted: boolean;
  votesCount: number;
  eligibleCount: number;
  result: {
    outcome: 'loser' | 'tie' | 'cancelled';
    loserName: string | null;
    tally: { name: string; votes: number }[];
  } | null;
}

export interface GameEventsState {
  serverNow: string;
  isGm: boolean;
  blackout: { endsAt: string; startedByMe: boolean } | null;
  duel: DuelState | null;
  inversion: {
    endsAt: string;
    player1Name: string;
    player2Name: string;
    revealedByVision: boolean;
  } | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private http = inject(HttpClient);
  private API = environment.apiUrl;

  getEvents(gameId: number): Observable<ApiResponse<GameEventsState>> {
    return this.http.get<ApiResponse<GameEventsState>>(`${this.API}/games/${gameId}/events`);
  }

  voteDuel(gameId: number, duelId: number, votedForId: number): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(
      `${this.API}/games/${gameId}/duels/${duelId}/vote`,
      { votedForId },
    );
  }

  cancelBlackout(gameId: number): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(
      `${this.API}/games/${gameId}/events/cancel-blackout`,
      {},
    );
  }
}

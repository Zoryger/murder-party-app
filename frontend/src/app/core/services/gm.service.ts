import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GmPlayer {
  id: number;
  username: string | null;
  characterName: string;
  characterTitle: string;
  powerName: string;
  status: 'alive' | 'ghost';
  money: number;
  isMurderer: boolean;
  messagingCode: string;
}

export interface GmOverview {
  game: { id: number; name: string; status: string };
  players: GmPlayer[];
  qrClues: { slug: string; title: string }[];
  cluePasswords: { name: string; password: string }[];
  pendingAlchemistCount: number;
}

export interface GmAlchemistRequest {
  id: number;
  playerName: string;
  username: string | null;
  question: string;
  cost: number;
  status: 'pending' | 'answered' | 'refused';
  answer: 'yes' | 'no' | null;
  createdAt: string;
  answeredAt: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class GmService {
  private http = inject(HttpClient);
  private API = environment.apiUrl;

  getOverview(gameId: number): Observable<ApiResponse<GmOverview>> {
    return this.http.get<ApiResponse<GmOverview>>(`${this.API}/games/${gameId}/gm/overview`);
  }

  getAlchemistRequests(gameId: number): Observable<ApiResponse<GmAlchemistRequest[]>> {
    return this.http.get<ApiResponse<GmAlchemistRequest[]>>(
      `${this.API}/games/${gameId}/gm/alchemist`,
    );
  }

  answerAlchemist(
    gameId: number,
    requestId: number,
    answer: 'yes' | 'no' | 'refuse',
  ): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(
      `${this.API}/games/${gameId}/gm/alchemist/${requestId}/answer`,
      { answer },
    );
  }
}

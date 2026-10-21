import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WalletInfo {
  playerId: number;
  money: number;
  status: 'alive' | 'ghost';
  alchemist: { enabled: boolean; cost: number };
}

export interface AlchemistRequestView {
  id: number;
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
export class EconomyService {
  private http = inject(HttpClient);
  private API = environment.apiUrl;

  getWallet(gameId: number): Observable<ApiResponse<WalletInfo>> {
    return this.http.get<ApiResponse<WalletInfo>>(`${this.API}/games/${gameId}/wallet`);
  }

  transferMoney(
    gameId: number,
    toPlayerId: number,
    amount: number,
  ): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.API}/games/${gameId}/money/transfer`, {
      toPlayerId,
      amount,
    });
  }

  getMyAlchemistRequests(gameId: number): Observable<ApiResponse<AlchemistRequestView[]>> {
    return this.http.get<ApiResponse<AlchemistRequestView[]>>(
      `${this.API}/games/${gameId}/alchemist/requests`,
    );
  }

  askAlchemist(gameId: number, question: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.API}/games/${gameId}/powers/alchimiste`, {
      question,
    });
  }
}

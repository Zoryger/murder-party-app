import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MyPower {
  slug:            string;
  name:            string;
  category:        string;
  description:     string;
  maxUses:         number;
  durationSeconds: number | null;
  usesRemaining:   number;
}

export interface ApiResponse<T> { success: boolean; data: T; message?: string; }

@Injectable({ providedIn: 'root' })
export class PowerService {
  private http = inject(HttpClient);
  private API  = environment.apiUrl;

  getMyPower(gameId: number): Observable<ApiResponse<MyPower>> {
    return this.http.get<ApiResponse<MyPower>>(`${this.API}/games/${gameId}/my-power`);
  }

  useVoyante(gameId: number): Observable<ApiResponse<{ characterTitle: string; powerName: string; powerCategory: string }[]>> {
    return this.http.post<ApiResponse<{ characterTitle: string; powerName: string; powerCategory: string }[]>>(
      `${this.API}/games/${gameId}/powers/voyante`, {});
  }

  useAnalyseurRelations(gameId: number, targetPlayerId1: number, targetPlayerId2: number): Observable<ApiResponse<{ player1: string; player2: string; relationType: string }>> {
    return this.http.post<ApiResponse<{ player1: string; player2: string; relationType: string }>>(
      `${this.API}/games/${gameId}/powers/analyseur-relations`, { targetPlayerId1, targetPlayerId2 });
  }

  useInformaticien(gameId: number, targetPlayerId1: number, targetPlayerId2: number): Observable<ApiResponse<{ conversationId: number }>> {
    return this.http.post<ApiResponse<{ conversationId: number }>>(
      `${this.API}/games/${gameId}/powers/informaticien`, { targetPlayerId1, targetPlayerId2 });
  }
}
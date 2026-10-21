import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PowerInfo {
  slug: string;
  name: string;
  category: string;
  description: string;
  maxUses: number;
  durationSeconds: number | null;
  usesRemaining: number;
  canUse: boolean;
  lockedReason: string | null;
}

export interface BorrowedPowerInfo extends PowerInfo {
  fromCharacterName: string;
}

export interface MyPowerOverview {
  status: 'alive' | 'ghost';
  own: PowerInfo;
  borrowed: BorrowedPowerInfo | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class PowerService {
  private http = inject(HttpClient);
  private API = environment.apiUrl;

  getMyPower(gameId: number): Observable<ApiResponse<MyPowerOverview>> {
    return this.http.get<ApiResponse<MyPowerOverview>>(`${this.API}/games/${gameId}/my-power`);
  }

  useVoyante(
    gameId: number,
  ): Observable<
    ApiResponse<{ characterTitle: string; powerName: string; powerCategory: string }[]>
  > {
    return this.http.post<
      ApiResponse<{ characterTitle: string; powerName: string; powerCategory: string }[]>
    >(`${this.API}/games/${gameId}/powers/voyante`, {});
  }

  useAnalyseurRelations(
    gameId: number,
    targetPlayerId1: number,
    targetPlayerId2: number,
  ): Observable<ApiResponse<{ player1: string; player2: string; relationType: string }>> {
    return this.http.post<ApiResponse<{ player1: string; player2: string; relationType: string }>>(
      `${this.API}/games/${gameId}/powers/analyseur-relations`,
      { targetPlayerId1, targetPlayerId2 },
    );
  }

  useInformaticien(
    gameId: number,
    targetPlayerId1: number,
    targetPlayerId2: number,
  ): Observable<ApiResponse<{ conversationId: number }>> {
    return this.http.post<ApiResponse<{ conversationId: number }>>(
      `${this.API}/games/${gameId}/powers/informaticien`,
      { targetPlayerId1, targetPlayerId2 },
    );
  }

  useFalsificateur(
    gameId: number,
    clueId: number,
    newGamePlayerId: number,
  ): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(
      `${this.API}/games/${gameId}/powers/falsificateur`,
      { clueId, newGamePlayerId },
    );
  }

  useUsurpateur(
    gameId: number,
    targetPlayerId1: number,
    targetPlayerId2: number,
    fakeSenderId: number,
    content: string,
  ): Observable<ApiResponse<{ conversationId: number }>> {
    return this.http.post<ApiResponse<{ conversationId: number }>>(
      `${this.API}/games/${gameId}/powers/usurpateur`,
      { targetPlayerId1, targetPlayerId2, fakeSenderId, content },
    );
  }

  useVisionAbsolue(
    gameId: number,
  ): Observable<ApiResponse<{ activatedAt: string; expiresAt: string }>> {
    return this.http.post<ApiResponse<{ activatedAt: string; expiresAt: string }>>(
      `${this.API}/games/${gameId}/powers/vision-absolue`,
      {},
    );
  }

  useChasseurDePrimes(
    gameId: number,
    code: string,
  ): Observable<ApiResponse<{ characterName: string }>> {
    return this.http.post<ApiResponse<{ characterName: string }>>(
      `${this.API}/games/${gameId}/powers/chasseur-de-primes`,
      { code },
    );
  }

  useNecromancien(
    gameId: number,
    code: string,
  ): Observable<ApiResponse<{ characterName: string }>> {
    return this.http.post<ApiResponse<{ characterName: string }>>(
      `${this.API}/games/${gameId}/powers/necromancien`,
      { code },
    );
  }

  useHorcruxe(gameId: number, substitutePlayerId: number): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.API}/games/${gameId}/powers/horcruxe`, {
      substitutePlayerId,
    });
  }

  useCupidon(
    gameId: number,
    targetPlayerId1: number,
    targetPlayerId2: number,
  ): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.API}/games/${gameId}/powers/cupidon`, {
      targetPlayerId1,
      targetPlayerId2,
    });
  }

  useDuelliste(
    gameId: number,
    targetPlayerId1: number,
    targetPlayerId2: number,
  ): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.API}/games/${gameId}/powers/duelliste`, {
      targetPlayerId1,
      targetPlayerId2,
    });
  }

  useInversionFrequence(
    gameId: number,
    targetPlayerId1: number,
    targetPlayerId2: number,
  ): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(
      `${this.API}/games/${gameId}/powers/inversion-de-frequence`,
      { targetPlayerId1, targetPlayerId2 },
    );
  }

  useBrouilleur(gameId: number): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(
      `${this.API}/games/${gameId}/powers/brouilleur-iem`,
      {},
    );
  }
}
